import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MapPin, Phone, User, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    payment_method: 'mpesa',
  });

  useEffect(() => {
    // Load cart from sessionStorage
    const savedCart = sessionStorage.getItem('checkout_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate(createPageUrl('Shop'));
    }

    // Load user data
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        name: userData.full_name || '',
        phone: userData.phone || '',
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const deliveryFee = 200; // Fixed delivery fee
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
      
      // Create customer record if not exists
      let customerId = '';
      if (user) {
        const existingCustomers = await base44.entities.Customer.filter({ phone: formData.phone });
        if (existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
        } else {
          const newCustomer = await base44.entities.Customer.create({
            name: formData.name,
            phone: formData.phone,
            email: user.email,
            location: formData.address,
            customer_type: 'individual',
            status: 'active',
            plastic_balance: 0,
            total_plastic_sold_kg: 0,
          });
          customerId = newCustomer.id;
        }
      }

      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.unit_price * item.quantity,
      }));

      const order = await base44.entities.Order.create({
        order_number: orderNum,
        customer_id: customerId,
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        amount_paid: 0,
        payment_status: 'pending',
        payment_method: formData.payment_method,
        order_status: 'pending',
        delivery_address: formData.address,
        notes: formData.notes,
      });

      return orderNum;
    },
    onSuccess: (orderNum) => {
      setOrderNumber(orderNum);
      setOrderPlaced(true);
      sessionStorage.removeItem('checkout_cart');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }
    createOrderMutation.mutate();
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500 mt-2 text-center">
          Your order #{orderNumber} has been received
        </p>
        <p className="text-sm text-gray-500 mt-1">
          We'll contact you shortly to confirm delivery
        </p>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('MyOrders'))}
          >
            View Orders
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('Shop'))}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Delivery Details */}
        <Card className="p-4 bg-white border-0 shadow-sm space-y-4">
          <h2 className="font-medium text-gray-900">Delivery Details</h2>
          
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="07XX XXX XXX"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Delivery Address *</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your delivery address"
                className="pl-10 resize-none"
                rows={2}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special instructions"
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <h2 className="font-medium text-gray-900 mb-3">Payment Method</h2>
          <RadioGroup
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
            className="space-y-2"
          >
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="mpesa" />
              <div className="flex-1">
                <p className="text-sm font-medium">M-Pesa</p>
                <p className="text-xs text-gray-500">Pay via M-Pesa</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="cash" />
              <div className="flex-1">
                <p className="text-sm font-medium">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay when you receive</p>
              </div>
            </label>
          </RadioGroup>
        </Card>

        {/* Order Summary */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <h2 className="font-medium text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product_name} × {item.quantity}
                </span>
                <span>KES {(item.unit_price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Delivery</span>
                <span>KES {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={createOrderMutation.isPending}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
        >
          {createOrderMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Place Order • KES ${total.toLocaleString()}`
          )}
        </Button>
      </form>
    </div>
  );
}