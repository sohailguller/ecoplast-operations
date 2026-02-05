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
import { format } from 'date-fns';

const shifts = ['morning', 'afternoon', 'night'];
const qualityStatuses = ['pending', 'approved', 'rejected'];

export default function ProductionFormSheet({ open, onOpenChange, production }) {
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity_produced: '',
    plastic_used_kg: '',
    production_date: format(new Date(), 'yyyy-MM-dd'),
    shift: 'morning',
    staff_name: '',
    quality_status: 'pending',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  useEffect(() => {
    if (production) {
      setFormData({
        product_id: production.product_id || '',
        product_name: production.product_name || '',
        quantity_produced: production.quantity_produced?.toString() || '',
        plastic_used_kg: production.plastic_used_kg?.toString() || '',
        production_date: production.production_date || format(new Date(), 'yyyy-MM-dd'),
        shift: production.shift || 'morning',
        staff_name: production.staff_name || '',
        quality_status: production.quality_status || 'pending',
        notes: production.notes || '',
      });
    } else {
      setFormData({
        product_id: '',
        product_name: '',
        quantity_produced: '',
        plastic_used_kg: '',
        production_date: format(new Date(), 'yyyy-MM-dd'),
        shift: 'morning',
        staff_name: '',
        quality_status: 'pending',
        notes: '',
      });
    }
  }, [production, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        quantity_produced: parseInt(data.quantity_produced) || 0,
        plastic_used_kg: parseFloat(data.plastic_used_kg) || 0,
      };
      
      if (production) {
        return base44.entities.Production.update(production.id, payload);
      }
      
      // Update product stock if approved
      if (payload.quality_status === 'approved' && payload.product_id) {
        const product = products.find(p => p.id === payload.product_id);
        if (product) {
          await base44.entities.Product.update(product.id, {
            stock_quantity: (product.stock_quantity || 0) + payload.quantity_produced,
          });
        }
      }
      
      return base44.entities.Production.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Production.delete(production.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: product.id,
        product_name: product.name,
      }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{production ? 'Edit Production Log' : 'Log Production'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Product Select */}
          <div>
            <Label>Product *</Label>
            <Select 
              value={formData.product_id}
              onValueChange={handleProductSelect}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Or enter manually */}
          {!formData.product_id && (
            <div>
              <Label htmlFor="product_name">Or Enter Product Name</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder="Product name"
                className="mt-1.5"
              />
            </div>
          )}

          {/* Quantity & Plastic Used */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity Produced *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity_produced}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_produced: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="plastic">Plastic Used (kg)</Label>
              <Input
                id="plastic"
                type="number"
                step="0.1"
                value={formData.plastic_used_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, plastic_used_kg: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Date & Shift */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Production Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData(prev => ({ ...prev, production_date: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Shift</Label>
              <Select 
                value={formData.shift} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map(shift => (
                    <SelectItem key={shift} value={shift} className="capitalize">
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Staff & QC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staff">Staff Name</Label>
              <Input
                id="staff"
                value={formData.staff_name}
                onChange={(e) => setFormData(prev => ({ ...prev, staff_name: e.target.value }))}
                placeholder="Worker name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Quality Status</Label>
              <Select 
                value={formData.quality_status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, quality_status: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualityStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any production notes"
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {production && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  if (window.confirm('Delete this production log?')) {
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
              ) : production ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}