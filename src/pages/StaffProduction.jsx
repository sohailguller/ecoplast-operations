import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Factory, Package, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function StaffProduction() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity_produced: '',
    plastic_used_kg: '',
    shift: 'morning',
    notes: '',
  });

  const queryClient = useQueryClient();

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

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['my-productions', user?.email],
    queryFn: () => base44.entities.Production.filter(
      { created_by: user.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Production.create({
      ...data,
      quantity_produced: parseInt(data.quantity_produced) || 0,
      plastic_used_kg: parseFloat(data.plastic_used_kg) || 0,
      production_date: format(new Date(), 'yyyy-MM-dd'),
      staff_id: user?.id,
      staff_name: user?.full_name,
      quality_status: 'pending',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-productions'] });
      setShowForm(false);
      setFormData({
        product_id: '',
        product_name: '',
        quantity_produced: '',
        plastic_used_kg: '',
        shift: 'morning',
        notes: '',
      });
    },
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_name || !formData.quantity_produced) {
      alert('Please fill in required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayProductions = productions.filter(p => p.production_date === today);
  const todayTotal = todayProductions.reduce((sum, p) => sum + (p.quantity_produced || 0), 0);

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Production Log"
        subtitle={`${todayTotal} units produced today`}
        action="Log Entry"
        actionIcon={Plus}
        onAction={() => setShowForm(true)}
      />

      <div className="p-4 space-y-4">
        {/* Today's Summary */}
        <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white">
          <p className="text-blue-100 text-sm">Today's Production</p>
          <p className="text-3xl font-bold mt-1">{todayTotal} units</p>
          <p className="text-blue-100 text-sm mt-2">
            {todayProductions.length} entries logged
          </p>
        </Card>

        {/* Production List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : productions.length === 0 ? (
          <EmptyState
            icon={Factory}
            title="No production logs"
            description="Start logging your production output"
            action="Log Entry"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {productions.map((prod) => (
              <Card key={prod.id} className="p-4 bg-white border-0 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prod.product_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(prod.created_date), 'MMM d, h:mm a')} • {prod.shift} shift
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {prod.quantity_produced} units
                    </p>
                    <StatusBadge status={prod.quality_status} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Production Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Log Production</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Product */}
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

            {/* Quantity */}
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

            {/* Plastic Used */}
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

            {/* Shift */}
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
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes about this production"
                className="mt-1.5 resize-none"
                rows={2}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : 'Save Entry'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}