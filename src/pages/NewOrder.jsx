import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Minus, Trash2, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [notes, setNotes] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }),
  });

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.product_id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total: product.price,
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(cartItems.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + (deliveryFee || 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      
      const orderData = {
        order_number: orderNumber,
        customer_id: selectedCustomer?.id || '',
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        customer_phone: selectedCustomer?.phone || '',
        items: cartItems,
        subtotal,
        delivery_fee: deliveryFee || 0,
        total_amount: total,
        amount_paid: 0,
        payment_status: 'pending',
        payment_method: paymentMethod,
        order_status: 'pending',
        delivery_address: deliveryAddress || selectedCustomer?.location || '',
        notes,
      };

      return base44.entities.Order.create(orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(createPageUrl('Orders'));
    },
  });

  const handleSubmit = () => {
    if (cartItems.length === 0) {
      alert('Please add items to the order');
      return;
    }
    createMutation.mutate();
  };

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
        <h1 className="text-lg font-semibold text-gray-900">New Order</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Customer Selection */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <Label className="text-xs text-gray-500 uppercase tracking-wide">Customer</Label>
          {selectedCustomer ? (
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {customerSearch && (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {filteredCustomers.slice(0, 5).map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setDeliveryAddress(customer.location || '');
                        setCustomerSearch('');
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Products */}
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wide px-1">Add Products</Label>
          <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {products.filter(p => p.stock_quantity > 0).map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 text-left transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-sm text-gray-900 mt-1">KES {product.price?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{product.stock_quantity} in stock</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        {cartItems.length > 0 && (
          <Card className="p-4 bg-white border-0 shadow-sm">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Order Items</Label>
            <div className="mt-3 space-y-3">
              {cartItems.map(item => (
                <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">KES {item.unit_price?.toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="w-20 text-right text-sm font-medium">
                      KES {item.total?.toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Delivery & Payment */}
        <Card className="p-4 bg-white border-0 shadow-sm space-y-4">
          <div>
            <Label htmlFor="address">Delivery Address</Label>
            <Input
              id="address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_fee">Delivery Fee (KES)</Label>
              <Input
                id="delivery_fee"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="plastic_credit">Plastic Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions"
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span>KES {deliveryFee?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>Total</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={cartItems.length === 0 || createMutation.isPending}
          className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Create Order • KES ${total.toLocaleString()}`
          )}
        </Button>
      </div>
    </div>
  );
}