import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Plus, Search, Filter, ShoppingCart, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing', 'ready'].includes(o.order_status)).length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Orders"
        subtitle={`${orders.length} total orders`}
        action="New Order"
        actionIcon={Plus}
        onAction={() => window.location.href = createPageUrl('NewOrder')}
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl h-auto">
            <TabsTrigger value="all" className="flex-1 rounded-lg text-xs py-2">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 rounded-lg text-xs py-2">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex-1 rounded-lg text-xs py-2">
              Active ({statusCounts.processing})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex-1 rounded-lg text-xs py-2">
              Delivered ({statusCounts.delivered})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description={searchQuery ? "Try adjusting your search" : "Orders will appear here"}
            action={!searchQuery && "Create Order"}
            onAction={() => window.location.href = createPageUrl('NewOrder')}
          />
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={createPageUrl(`OrderDetail?id=${order.id}`)}
              >
                <Card className="p-4 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow transition-shadow select-none">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {order.order_number || `#${order.id?.slice(-6).toUpperCase()}`}
                        </p>
                        <StatusBadge status={order.order_status} />
                        <StatusBadge status={order.payment_status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{order.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.items?.length || 0} items • {format(new Date(order.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        KES {order.total_amount?.toLocaleString()}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </PullToRefresh>
  );
}