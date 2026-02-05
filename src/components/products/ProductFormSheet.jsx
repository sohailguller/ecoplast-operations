import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';

const categories = ['furniture', 'construction', 'household', 'garden', 'other'];

export default function ProductFormSheet({ open, onOpenChange, product }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'furniture',
    price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '5',
    unit: 'piece',
    image_url: '',
    status: 'active'
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'furniture',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        min_stock_level: product.min_stock_level?.toString() || '5',
        unit: product.unit || 'piece',
        image_url: product.image_url || '',
        status: product.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'furniture',
        price: '',
        cost: '',
        stock_quantity: '',
        min_stock_level: '5',
        unit: 'piece',
        image_url: '',
        status: 'active'
      });
    }
  }, [product, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        min_stock_level: parseInt(data.min_stock_level) || 5,
      };
      if (product) {
        return base44.entities.Product.update(product.id, payload);
      }
      return base44.entities.Product.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product ? 'Edit Product' : 'Add Product'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Image Upload */}
          <div>
            <Label>Product Image</Label>
            <div className="mt-2">
              {formData.image_url ? (
                <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <img 
                    src={formData.image_url} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500 mt-2">Upload image</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
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
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter product description"
              className="mt-1.5 resize-none"
              rows={3}
            />
          </div>

          {/* Price & Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Selling Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost Price (KES)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Current Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="min_stock">Min Stock Level</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                placeholder="5"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
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
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : product ? 'Update' : 'Add Product'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}