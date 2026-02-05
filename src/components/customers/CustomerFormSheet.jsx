import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';

const customerTypes = ['individual', 'business', 'community_partner'];

export default function CustomerFormSheet({ open, onOpenChange, customer }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    customer_type: 'individual',
    status: 'active',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        location: customer.location || '',
        customer_type: customer.customer_type || 'individual',
        status: customer.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        customer_type: 'individual',
        status: 'active',
      });
    }
  }, [customer, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (customer) {
        return base44.entities.Customer.update(customer.id, data);
      }
      return base44.entities.Customer.create({
        ...data,
        plastic_balance: 0,
        total_plastic_sold_kg: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Customer.delete(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{customer ? 'Edit Customer' : 'Add Customer'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Customer name"
              className="mt-1.5"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="07XX XXX XXX"
              className="mt-1.5"
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              className="mt-1.5"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Area or address"
              className="mt-1.5"
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer Type</Label>
              <Select 
                value={formData.customer_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_type: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Balance Info (read-only) */}
          {customer && (customer.plastic_balance > 0 || customer.total_plastic_sold_kg > 0) && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Plastic Balance</span>
                <span className="text-sm font-medium">KES {customer.plastic_balance?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Plastic Sold</span>
                <span className="text-sm font-medium">{customer.total_plastic_sold_kg?.toLocaleString() || 0} kg</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {customer && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  if (window.confirm('Delete this customer?')) {
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
              ) : customer ? 'Update' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}