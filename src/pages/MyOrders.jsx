import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Package, ChevronRight, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function MyOrders() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error(e);
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Get orders by customer phone or email
      const allOrders = await base44.entities.Order.list('-created_date', 100);
      return allOrders.filter(o => 
        o.created_by === user.email || 
        o.customer_phone === user.phone
      );
    },
    enabled: !!user,
  });

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(order.order_status);
    if (statusFilter === 'completed') return order.order_status === 'delivered';
    return true;
  });

  const getStatusStep = (status) => {
    const steps = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track your order status</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl h-auto">
            <TabsTrigger value="all" className="flex-1 rounded-lg text-xs py-2">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1 rounded-lg text-xs py-2">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 rounded-lg text-xs py-2">
              Completed
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
            icon={Package}
            title="No orders yet"
            description="Your orders will appear here"
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id}
                className="p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {order.order_number || `#${order.id?.slice(-6).toUpperCase()}`}
                      </p>
                      <StatusBadge status={order.order_status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items?.length || 0} items • {format(new Date(order.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      KES {order.total_amount?.toLocaleString()}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle>
                  Order {selectedOrder.order_number || `#${selectedOrder.id?.slice(-6).toUpperCase()}`}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Status Timeline */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900">Order Status</p>
                  <div className="relative">
                    <div className="flex justify-between mb-2">
                      {['Pending', 'Confirmed', 'Processing', 'Ready', 'Delivering', 'Delivered'].map((step, idx) => {
                        const currentStep = getStatusStep(selectedOrder.order_status);
                        const isComplete = idx <= currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              isComplete ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                            } ${isCurrent ? 'ring-2 ring-emerald-200' : ''}`}>
                              {isComplete ? '✓' : idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200 -z-10">
                      <div 
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${(getStatusStep(selectedOrder.order_status) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Pending</span>
                    <span>Confirmed</span>
                    <span>Processing</span>
                    <span>Ready</span>
                    <span>Delivering</span>
                    <span>Delivered</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">
                          KES {item.total?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>KES {selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span>KES {selectedOrder.delivery_fee?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>KES {selectedOrder.total_amount?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                {selectedOrder.delivery_address && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                    <p className="text-sm text-gray-600">{selectedOrder.delivery_address}</p>
                  </div>
                )}

                {/* Payment Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Payment</span>
                  <StatusBadge status={selectedOrder.payment_status} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}