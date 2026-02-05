import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ArrowLeft, Phone, MapPin, Package, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';

const orderStatuses = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
const paymentStatuses = ['pending', 'partial', 'paid'];

export default function OrderDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ order_status: newStatus });
  };

  const handlePaymentStatusChange = (newStatus) => {
    updateMutation.mutate({ payment_status: newStatus });
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    const newAmountPaid = (order.amount_paid || 0) + amount;
    const newPaymentStatus = newAmountPaid >= order.total_amount ? 'paid' : 'partial';

    updateMutation.mutate({
      amount_paid: newAmountPaid,
      payment_status: newPaymentStatus,
    });

    setPaymentAmount('');
    setShowPayment(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500">Order not found</p>
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('Orders'))}
          className="mt-4"
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const balance = order.total_amount - (order.amount_paid || 0);

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {order.order_number || `#${order.id?.slice(-6).toUpperCase()}`}
            </h1>
            <p className="text-xs text-gray-500">
              {format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.order_status} size="lg" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Customer</p>
          <p className="font-medium text-gray-900">{order.customer_name}</p>
          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="flex items-center gap-2 text-sm text-gray-600 mt-2 hover:text-gray-900"
            >
              <Phone className="w-4 h-4" />
              {order.customer_phone}
            </a>
          )}
          {order.delivery_address && (
            <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              {order.delivery_address}
            </p>
          )}
        </Card>

        {/* Order Items */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Items</p>
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × KES {item.unit_price?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">KES {item.total?.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>KES {order.subtotal?.toLocaleString()}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span>KES {order.delivery_fee?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>KES {order.total_amount?.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Payment Status */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
            <StatusBadge status={order.payment_status} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="text-emerald-600 font-medium">
                KES {(order.amount_paid || 0).toLocaleString()}
              </span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance Due</span>
                <span className="text-red-600 font-medium">
                  KES {balance.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {balance > 0 && (
            <div className="mt-4">
              {showPayment ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="payment">Payment Amount</Label>
                    <Input
                      id="payment"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={balance.toString()}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPayment(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddPayment}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Add Payment'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowPayment(true)}
                  variant="outline"
                  className="w-full"
                >
                  Record Payment
                </Button>
              )}
            </div>
          )}

          {balance <= 0 && order.payment_status === 'paid' && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Fully Paid</span>
            </div>
          )}
        </Card>

        {/* Order Status Update */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Update Status</p>
          <Select value={order.order_status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderStatuses.map(status => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card className="p-4 bg-white border-0 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm text-gray-700">{order.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}