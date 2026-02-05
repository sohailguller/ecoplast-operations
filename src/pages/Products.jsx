import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ProductFormSheet from '../components/products/ProductFormSheet';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const categories = ['all', 'furniture', 'construction', 'household', 'garden', 'other'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Products"
        subtitle={`${products.length} products`}
        action="Add Product"
        actionIcon={Plus}
        onAction={() => {
          setEditingProduct(null);
          setShowForm(true);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Category Tabs */}
        <div className="overflow-x-auto -mx-4 px-4">
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
            <TabsList className="bg-gray-100 p-1 rounded-xl h-auto w-max">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="rounded-lg text-xs py-2 px-3 capitalize"
                >
                  {cat === 'all' ? 'All' : cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-white border-0 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Add products to start selling"
            action="Add Product"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-white border-0 shadow-sm overflow-hidden group">
                <div className="aspect-square bg-gray-100 relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 backdrop-blur">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {product.stock_quantity <= product.min_stock_level && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full">
                        Low Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-semibold text-gray-900">
                      KES {product.price?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.stock_quantity} in stock
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProductFormSheet 
        open={showForm}
        onOpenChange={setShowForm}
        product={editingProduct}
      />
    </div>
  );
}