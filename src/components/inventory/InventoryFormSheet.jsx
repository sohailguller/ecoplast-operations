import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';

const categories = ['raw_plastic', 'processed_plastic', 'chemicals', 'equipment', 'packaging', 'other'];
const units = ['kg', 'liters', 'pieces', 'bags', 'rolls', 'boxes'];

export default function InventoryFormSheet({ open, onOpenChange, item }) {
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'raw_plastic',
    quantity: '',
    unit: 'kg',
    min_stock_level: '10',
    cost_per_unit: '',
    location: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '',
        category: item.category || 'raw_plastic',
        quantity: item.quantity?.toString() || '',
        unit: item.unit || 'kg',
        min_stock_level: item.min_stock_level?.toString() || '10',
        cost_per_unit: item.cost_per_unit?.toString() || '',
        location: item.location || '',
      });
    } else {
      setFormData({
        item_name: '',
        category: 'raw_plastic',
        quantity: '',
        unit: 'kg',
        min_stock_level: '10',
        cost_per_unit: '',
        location: '',
      });
    }
  }, [item, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const quantity = parseFloat(data.quantity) || 0;
      const minStock = parseFloat(data.min_stock_level) || 10;
      
      const payload = {
        ...data,
        quantity,
        min_stock_level: minStock,
        cost_per_unit: parseFloat(data.cost_per_unit) || 0,
        status: quantity <= minStock ? (quantity === 0 ? 'out_of_stock' : 'low_stock') : 'in_stock',
        last_restocked: new Date().toISOString().split('T')[0],
      };
      
      if (item) {
        return base44.entities.Inventory.update(item.id, payload);
      }
      return base44.entities.Inventory.create(payload);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['inventory'] });
      const previousInventory = queryClient.getQueryData(['inventory']);
      
      queryClient.setQueryData(['inventory'], (old = []) => {
        const quantity = parseFloat(newData.quantity) || 0;
        const minStock = parseFloat(newData.min_stock_level) || 10;
        
        const payload = {
          ...newData,
          quantity,
          min_stock_level: minStock,
          cost_per_unit: parseFloat(newData.cost_per_unit) || 0,
          status: quantity <= minStock ? (quantity === 0 ? 'out_of_stock' : 'low_stock') : 'in_stock',
          last_restocked: new Date().toISOString().split('T')[0],
        };
        
        if (item) {
          return old.map(i => i.id === item.id ? { ...i, ...payload } : i);
        }
        return [...old, { ...payload, id: `temp-${Date.now()}`, created_date: new Date().toISOString() }];
      });
      
      return { previousInventory };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['inventory'], context.previousInventory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Inventory.delete(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this inventory item?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Edit Item' : 'Add Inventory Item'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Item Name */}
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.item_name}
              onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
              placeholder="e.g., PET Flakes"
              className="mt-1.5"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label>Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit} className="capitalize">
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Min Stock & Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_stock">Min Stock Level</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                placeholder="10"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost per Unit (KES)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Warehouse A, Shelf 3"
              className="mt-1.5"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {item && (
              <Button 
                type="button" 
                variant="outline"
                onClick={handleDelete}
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
              ) : item ? 'Update' : 'Add Item'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}