import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Search, Recycle, Scale, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import CollectionFormSheet from '@/components/collection/CollectionFormSheet';

export default function PlasticCollection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['plasticCollections'],
    queryFn: () => base44.entities.PlasticCollection.list('-created_date', 200),
  });

  const filteredCollections = collections.filter(c => 
    !searchQuery || 
    c.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.plastic_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const monthlyCollections = collections.filter(c => c.created_date >= monthStart);
  const totalWeight = monthlyCollections.reduce((sum, c) => sum + (c.weight_kg || 0), 0);
  const totalPaid = monthlyCollections.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const pendingPayments = collections.filter(c => c.payment_status === 'pending')
    .reduce((sum, c) => sum + (c.total_amount || 0), 0);

  const plasticColors = {
    PET: 'bg-blue-100 text-blue-700',
    HDPE: 'bg-green-100 text-green-700',
    PVC: 'bg-purple-100 text-purple-700',
    LDPE: 'bg-yellow-100 text-yellow-700',
    PP: 'bg-orange-100 text-orange-700',
    PS: 'bg-pink-100 text-pink-700',
    mixed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Plastic Collection"
        subtitle="Track incoming materials"
        action="Record Collection"
        actionIcon={Plus}
        onAction={() => {
          setEditingCollection(null);
          setShowForm(true);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="This Month"
            value={`${totalWeight.toLocaleString()} kg`}
            icon={Scale}
          />
          <StatCard
            title="Total Paid"
            value={`KES ${totalPaid.toLocaleString()}`}
            icon={Banknote}
          />
          <StatCard
            title="Pending"
            value={`KES ${pendingPayments.toLocaleString()}`}
            icon={Recycle}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by supplier or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Collections List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredCollections.length === 0 ? (
          <EmptyState
            icon={Recycle}
            title="No collections recorded"
            description="Record plastic collections from suppliers"
            action="Record Collection"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {filteredCollections.map((collection) => (
              <Card 
                key={collection.id} 
                className="p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow"
                onClick={() => {
                  setEditingCollection(collection);
                  setShowForm(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{collection.supplier_name}</p>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${plasticColors[collection.plastic_type] || plasticColors.mixed}`}>
                        {collection.plastic_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(collection.created_date), 'MMM d, h:mm a')}
                      {collection.collected_by && ` • ${collection.collected_by}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {collection.weight_kg} kg
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        KES {collection.total_amount?.toLocaleString()}
                      </p>
                      <StatusBadge status={collection.payment_status} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CollectionFormSheet 
        open={showForm}
        onOpenChange={setShowForm}
        collection={editingCollection}
      />
    </div>
  );
}