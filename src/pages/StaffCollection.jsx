import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Recycle, Scale, Loader2 } from 'lucide-react';
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

const plasticTypes = ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'mixed'];

const plasticColors = {
  PET: 'bg-blue-100 text-blue-700',
  HDPE: 'bg-green-100 text-green-700',
  PVC: 'bg-purple-100 text-purple-700',
  LDPE: 'bg-yellow-100 text-yellow-700',
  PP: 'bg-orange-100 text-orange-700',
  PS: 'bg-pink-100 text-pink-700',
  mixed: 'bg-gray-100 text-gray-700',
};

export default function StaffCollection() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: '',
    plastic_type: 'mixed',
    weight_kg: '',
    price_per_kg: '20',
    payment_method: 'mpesa',
    payment_status: 'pending',
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

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['my-collections-staff', user?.full_name],
    queryFn: () => base44.entities.PlasticCollection.filter(
      { collected_by: user.full_name },
      '-created_date',
      50
    ),
    enabled: !!user?.full_name,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const weight = parseFloat(data.weight_kg) || 0;
      const price = parseFloat(data.price_per_kg) || 0;
      const total = weight * price;

      return base44.entities.PlasticCollection.create({
        ...data,
        weight_kg: weight,
        price_per_kg: price,
        total_amount: total,
        collected_by: user?.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-collections-staff'] });
      setShowForm(false);
      setFormData({
        supplier_name: '',
        supplier_phone: '',
        plastic_type: 'mixed',
        weight_kg: '',
        price_per_kg: '20',
        payment_method: 'mpesa',
        payment_status: 'pending',
        notes: '',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplier_name || !formData.weight_kg) {
      alert('Please fill in required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCollections = collections.filter(c => c.created_date?.startsWith(today));
  const todayTotal = todayCollections.reduce((sum, c) => sum + (c.weight_kg || 0), 0);

  const calculatedTotal = (parseFloat(formData.weight_kg) || 0) * (parseFloat(formData.price_per_kg) || 0);

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Plastic Collection"
        subtitle={`${todayTotal} kg collected today`}
        action="Record"
        actionIcon={Plus}
        onAction={() => setShowForm(true)}
      />

      <div className="p-4 space-y-4">
        {/* Today's Summary */}
        <Card className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 text-white">
          <p className="text-emerald-100 text-sm">Today's Collection</p>
          <p className="text-3xl font-bold mt-1">{todayTotal} kg</p>
          <p className="text-emerald-100 text-sm mt-2">
            {todayCollections.length} collections recorded
          </p>
        </Card>

        {/* Collection List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon={Recycle}
            title="No collections"
            description="Start recording plastic collections"
            action="Record Collection"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {collections.map((col) => (
              <Card key={col.id} className="p-4 bg-white border-0 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Scale className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{col.supplier_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${plasticColors[col.plastic_type] || plasticColors.mixed}`}>
                          {col.plastic_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(col.created_date), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{col.weight_kg} kg</p>
                    <p className="text-xs text-gray-500">KES {col.total_amount?.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Record Collection Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Collection</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Supplier */}
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.supplier_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_phone: e.target.value }))}
                placeholder="07XX XXX XXX"
                className="mt-1.5"
              />
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
                <Label htmlFor="price">Price/kg (KES)</Label>
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
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-lg font-bold text-gray-900">
                  KES {calculatedTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes"
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
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : 'Save'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}