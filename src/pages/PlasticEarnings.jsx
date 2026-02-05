import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Recycle, Wallet, TrendingUp, Scale, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';

export default function PlasticEarnings() {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Find customer record by phone
      if (userData.phone) {
        const customers = await base44.entities.Customer.filter({ phone: userData.phone });
        if (customers.length > 0) {
          setCustomer(customers[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['my-collections', user?.phone],
    queryFn: async () => {
      if (!user?.phone) return [];
      return base44.entities.PlasticCollection.filter(
        { supplier_phone: user.phone },
        '-created_date',
        50
      );
    },
    enabled: !!user?.phone,
  });

  const totalEarnings = collections.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const totalWeight = collections.reduce((sum, c) => sum + (c.weight_kg || 0), 0);
  const pendingPayments = collections
    .filter(c => c.payment_status === 'pending')
    .reduce((sum, c) => sum + (c.total_amount || 0), 0);

  const plasticTypeColors = {
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
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-4 py-8 text-white">
        <h1 className="text-2xl font-bold">Plastic Earnings</h1>
        <p className="text-purple-100 mt-1">Track your recycling rewards</p>
        
        <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-2xl">
          <p className="text-purple-100 text-sm">Available Balance</p>
          <p className="text-3xl font-bold mt-1">
            KES {(customer?.plastic_balance || pendingPayments).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Earned"
            value={`KES ${totalEarnings.toLocaleString()}`}
            icon={Wallet}
          />
          <StatCard
            title="Plastic Sold"
            value={`${totalWeight.toLocaleString()} kg`}
            icon={Scale}
          />
        </div>

        {/* How It Works */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Collect Plastic</p>
                <p className="text-xs text-gray-500">Gather clean plastic waste (PET, HDPE, etc.)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Bring to Collection Point</p>
                <p className="text-xs text-gray-500">Visit our center or request pickup</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Get Paid</p>
                <p className="text-xs text-gray-500">Receive M-Pesa payment or store credit</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Price List */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Current Rates (per kg)</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'PET', price: 25 },
              { type: 'HDPE', price: 20 },
              { type: 'PP', price: 18 },
              { type: 'LDPE', price: 15 },
              { type: 'Mixed', price: 12 },
            ].map(item => (
              <div 
                key={item.type} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plasticTypeColors[item.type] || plasticTypeColors.mixed}`}>
                  {item.type}
                </span>
                <span className="text-sm font-semibold">KES {item.price}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Transaction History */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Transaction History</h2>
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
              title="No transactions yet"
              description="Start selling plastic to earn rewards"
            />
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <Card key={collection.id} className="p-4 bg-white border-0 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Plastic Sale</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${plasticTypeColors[collection.plastic_type] || plasticTypeColors.mixed}`}>
                            {collection.plastic_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {collection.weight_kg} kg
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(collection.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        +KES {collection.total_amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {collection.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}