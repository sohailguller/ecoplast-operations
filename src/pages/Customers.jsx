import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import CustomerFormSheet from '@/components/customers/CustomerFormSheet';

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesType = typeFilter === 'all' || customer.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Customers"
        subtitle={`${customers.length} customers`}
        action="Add Customer"
        actionIcon={Plus}
        onAction={() => {
          setEditingCustomer(null);
          setShowForm(true);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Type Filter */}
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl h-auto">
            <TabsTrigger value="all" className="flex-1 rounded-lg text-xs py-2">
              All
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex-1 rounded-lg text-xs py-2">
              Individual
            </TabsTrigger>
            <TabsTrigger value="business" className="flex-1 rounded-lg text-xs py-2">
              Business
            </TabsTrigger>
            <TabsTrigger value="community_partner" className="flex-1 rounded-lg text-xs py-2">
              Partner
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Customers List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add customers to start tracking"
            action="Add Customer"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className="p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow"
                onClick={() => handleEdit(customer)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <StatusBadge status={customer.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {customer.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {customer.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {customer.plastic_balance > 0 && (
                      <p className="text-sm font-semibold text-emerald-600">
                        KES {customer.plastic_balance?.toLocaleString()}
                      </p>
                    )}
                    {customer.total_plastic_sold_kg > 0 && (
                      <p className="text-xs text-gray-500">
                        {customer.total_plastic_sold_kg} kg sold
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CustomerFormSheet 
        open={showForm}
        onOpenChange={setShowForm}
        customer={editingCustomer}
      />
    </div>
  );
}