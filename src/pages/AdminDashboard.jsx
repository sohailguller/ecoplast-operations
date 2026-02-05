import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import {
  ShoppingCart,
  Package,
  Recycle,
  Factory,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function AdminDashboard() {
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: plasticCollections = [] } = useQuery({
    queryKey: ['plasticCollections'],
    queryFn: () => base44.entities.PlasticCollection.list('-created_date', 100),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list('-created_date', 50),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  // Calculate metrics
  const monthlyOrders = orders.filter(o => 
    o.created_date >= monthStart && o.created_date <= monthEnd
  );
  const totalRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalCollected = monthlyOrders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
  
  const totalPlastic = plasticCollections
    .filter(p => p.created_date >= monthStart)
    .reduce((sum, p) => sum + (p.weight_kg || 0), 0);

  const totalProduced = productions
    .filter(p => p.created_date >= monthStart)
    .reduce((sum, p) => sum + (p.quantity_produced || 0), 0);

  const pendingOrders = orders.filter(o => 
    ['pending', 'confirmed', 'processing'].includes(o.order_status)
  ).length;

  const lowStockItems = inventory.filter(i => 
    i.quantity <= i.min_stock_level
  );

  const lowStockProducts = products.filter(p => 
    p.stock_quantity <= p.min_stock_level
  );

  const recentOrders = orders.slice(0, 5);

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['plasticCollections'] }),
      queryClient.invalidateQueries({ queryKey: ['productions'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-24 lg:pb-8">
        {/* Header */}
        <div className="px-4 py-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <div className="p-4 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Monthly Revenue"
            value={`KES ${totalRevenue.toLocaleString()}`}
            subtitle={`${totalCollected.toLocaleString()} collected`}
            icon={TrendingUp}
          />
          <StatCard
            title="Orders"
            value={monthlyOrders.length}
            subtitle={`${pendingOrders} pending`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Plastic Collected"
            value={`${totalPlastic.toLocaleString()} kg`}
            subtitle="This month"
            icon={Recycle}
          />
          <StatCard
            title="Items Produced"
            value={totalProduced}
            subtitle="This month"
            icon={Factory}
          />
        </div>

        {/* Alerts Section */}
        {(lowStockItems.length > 0 || lowStockProducts.length > 0) && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-200">Attention Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {lowStockItems.length > 0 && `${lowStockItems.length} inventory items low on stock. `}
                  {lowStockProducts.length > 0 && `${lowStockProducts.length} products need restocking.`}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Link to={createPageUrl('Customers')}>
            <Card className="p-4 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customers.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customers</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to={createPageUrl('Products')}>
            <Card className="p-4 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Package className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{products.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to={createPageUrl('Inventory')}>
            <Card className="p-4 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Package className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{inventory.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inventory Items</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <div>
          <SectionHeader 
            title="Recent Orders" 
            action="View All"
            onAction={() => window.location.href = createPageUrl('Orders')}
          />
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={createPageUrl(`OrderDetail?id=${order.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {order.order_number || `#${order.id?.slice(-6)}`}
                        </p>
                        <StatusBadge status={order.order_status} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {order.customer_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          KES {order.total_amount?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(order.created_date), 'MMM d')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div>
            <SectionHeader 
              title="Low Stock Products" 
              action="Manage"
              onAction={() => window.location.href = createPageUrl('Products')}
            />
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {product.stock_quantity} left
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Min: {product.min_stock_level}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        </div>
      </div>
    </PullToRefresh>
  );
}