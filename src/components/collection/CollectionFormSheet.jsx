import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';

const plasticTypes = ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'mixed'];
const paymentMethods = ['mpesa', 'cash', 'credit'];

export default function CollectionFormSheet({ open, onOpenChange, collection }) {
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: '',
    supplier_id: '',
    plastic_type: 'mixed',
    weight_kg: '',
    price_per_kg: '',
    total_amount: '',
    payment_status: 'pending',
    payment_method: 'mpesa',
    collected_by: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        supplier_name: collection.supplier_name || '',
        supplier_phone: collection.supplier_phone || '',
        supplier_id: collection.supplier_id || '',
        plastic_type: collection.plastic_type || 'mixed',
        weight_kg: collection.weight_kg?.toString() || '',
        price_per_kg: collection.price_per_kg?.toString() || '',
        total_amount: collection.total_amount?.toString() || '',
        payment_status: collection.payment_status || 'pending',
        payment_method: collection.payment_method || 'mpesa',
        collected_by: collection.collected_by || '',
        notes: collection.notes || '',
      });
    } else {
      setFormData({
        supplier_name: '',
        supplier_phone: '',
        supplier_id: '',
        plastic_type: 'mixed',
        weight_kg: '',
        price_per_kg: '20',
        total_amount: '',
        payment_status: 'pending',
        payment_method: 'mpesa',
        collected_by: '',
        notes: '',
      });
    }
  }, [collection, open]);

  // Calculate total when weight or price changes
  useEffect(() => {
    const weight = parseFloat(formData.weight_kg) || 0;
    const price = parseFloat(formData.price_per_kg) || 0;
    setFormData(prev => ({
      ...prev,
      total_amount: (weight * price).toString()
    }));
  }, [formData.weight_kg, formData.price_per_kg]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        weight_kg: parseFloat(data.weight_kg) || 0,
        price_per_kg: parseFloat(data.price_per_kg) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
      };
      
      if (collection) {
        return base44.entities.PlasticCollection.update(collection.id, payload);
      }
      
      // Also update customer's plastic balance if supplier_id exists
      if (payload.supplier_id && payload.payment_status === 'pending') {
        const customer = customers.find(c => c.id === payload.supplier_id);
        if (customer) {
          await base44.entities.Customer.update(customer.id, {
            plastic_balance: (customer.plastic_balance || 0) + payload.total_amount,
            total_plastic_sold_kg: (customer.total_plastic_sold_kg || 0) + payload.weight_kg,
          });
        }
      }
      
      return base44.entities.PlasticCollection.create(payload);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['plasticCollections'] });
      const previousCollections = queryClient.getQueryData(['plasticCollections']);
      
      queryClient.setQueryData(['plasticCollections'], (old = []) => {
        const payload = {
          ...newData,
          weight_kg: parseFloat(newData.weight_kg) || 0,
          price_per_kg: parseFloat(newData.price_per_kg) || 0,
          total_amount: parseFloat(newData.total_amount) || 0,
        };
        
        if (collection) {
          return old.map(c => c.id === collection.id ? { ...c, ...payload } : c);
        }
        return [{ ...payload, id: `temp-${Date.now()}`, created_date: new Date().toISOString() }, ...old];
      });
      
      return { previousCollections };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['plasticCollections'], context.previousCollections);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plasticCollections'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.PlasticCollection.delete(collection.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plasticCollections'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleSupplierSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        supplier_id: customer.id,
        supplier_name: customer.name,
        supplier_phone: customer.phone,
      }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{collection ? 'Edit Collection' : 'Record Collection'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Existing Supplier */}
          {customers.length > 0 && !collection && (
            <div>
              <Label>Select Existing Supplier</Label>
              <Select onValueChange={handleSupplierSelect}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose or enter new below" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Supplier Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                placeholder="Name"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.supplier_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_phone: e.target.value }))}
                placeholder="07XX XXX XXX"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Plastic Type */}
          <div>
            <Label>Plastic Type *</Label>
            <Select 
              value={formData.plastic_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, plastic_type: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plasticTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price per kg (KES)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price_per_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_kg: e.target.value }))}
                placeholder="20"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Total */}
          <div>
            <Label>Total Amount</Label>
            <div className="mt-1.5 p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">
                KES {parseFloat(formData.total_amount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Status</Label>
              <Select 
                value={formData.payment_status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method} className="capitalize">
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collected By */}
          <div>
            <Label htmlFor="collected_by">Collected By</Label>
            <Input
              id="collected_by"
              value={formData.collected_by}
              onChange={(e) => setFormData(prev => ({ ...prev, collected_by: e.target.value }))}
              placeholder="Staff name"
              className="mt-1.5"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes"
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {collection && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  if (window.confirm('Delete this collection record?')) {
                    deleteMutation.mutate();
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gray-900 hover:bg-gray-800"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : collection ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}