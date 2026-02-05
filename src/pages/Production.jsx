import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { Plus, Search, Factory, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import ProductionFormSheet from '../components/production/ProductionFormSheet';

export default function Production() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list('-created_date', 200),
  });

  const filteredProductions = productions.filter(p => 
    !searchQuery || 
    p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.staff_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const monthlyProductions = productions.filter(p => p.created_date >= monthStart);
  const totalProduced = monthlyProductions.reduce((sum, p) => sum + (p.quantity_produced || 0), 0);
  const totalPlasticUsed = monthlyProductions.reduce((sum, p) => sum + (p.plastic_used_kg || 0), 0);
  const pendingQC = productions.filter(p => p.quality_status === 'pending').length;

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Production"
        subtitle="Track manufacturing output"
        action="Log Production"
        actionIcon={Plus}
        onAction={() => {
          setEditingProduction(null);
          setShowForm(true);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Items Made"
            value={totalProduced}
            subtitle="This month"
            icon={Package}
          />
          <StatCard
            title="Plastic Used"
            value={`${totalPlasticUsed} kg`}
            icon={Factory}
          />
          <StatCard
            title="Pending QC"
            value={pendingQC}
            icon={Factory}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search production logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

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
        ) : filteredProductions.length === 0 ? (
          <EmptyState
            icon={Factory}
            title="No production logs"
            description="Record daily production output"
            action="Log Production"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {filteredProductions.map((production) => (
              <Card 
                key={production.id} 
                className="p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow"
                onClick={() => {
                  setEditingProduction(production);
                  setShowForm(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{production.product_name}</p>
                      <StatusBadge status={production.quality_status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(production.created_date), 'MMM d, yyyy')}
                      {production.shift && ` • ${production.shift} shift`}
                      {production.staff_name && ` • ${production.staff_name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {production.quantity_produced} units
                    </p>
                    {production.plastic_used_kg && (
                      <p className="text-xs text-gray-500">
                        {production.plastic_used_kg} kg plastic
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProductionFormSheet 
        open={showForm}
        onOpenChange={setShowForm}
        production={editingProduction}
      />
    </div>
  );
}