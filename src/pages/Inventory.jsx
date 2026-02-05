import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import InventoryFormSheet from '../components/inventory/InventoryFormSheet';

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('-created_date'),
  });

  const categories = ['all', 'raw_plastic', 'processed_plastic', 'chemicals', 'equipment', 'packaging', 'other'];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchQuery || 
      item.item_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = inventory.filter(i => i.quantity <= i.min_stock_level).length;

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Inventory"
        subtitle={`${inventory.length} items${lowStockCount > 0 ? ` • ${lowStockCount} low stock` : ''}`}
        action="Add Item"
        actionIcon={Plus}
        onAction={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">
                {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
              </p>
            </div>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search inventory..."
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
                  className="rounded-lg text-xs py-2 px-3 capitalize whitespace-nowrap"
                >
                  {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Inventory List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredInventory.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items"
            description="Add materials and supplies to track"
            action="Add Item"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {filteredInventory.map((item) => {
              const isLowStock = item.quantity <= item.min_stock_level;
              return (
                <Card 
                  key={item.id} 
                  className={`p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow ${isLowStock ? 'ring-1 ring-amber-200' : ''}`}
                  onClick={() => handleEdit(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isLowStock ? 'bg-amber-100' : 'bg-gray-100'}`}>
                        <Package className={`w-5 h-5 ${isLowStock ? 'text-amber-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.category?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {item.min_stock_level}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <InventoryFormSheet 
        open={showForm}
        onOpenChange={setShowForm}
        item={editingItem}
      />
    </div>
  );
}