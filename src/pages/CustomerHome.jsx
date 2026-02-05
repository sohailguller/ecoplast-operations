import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingBag, Truck, Wallet, BookOpen, ArrowRight, Recycle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CustomerHome() {
  const [user, setUser] = useState(null);

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

  const { data: products = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const all = await base44.entities.Product.filter({ status: 'active' });
      return all.slice(0, 4);
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['featured-posts'],
    queryFn: async () => {
      const all = await base44.entities.EducationalPost.filter({ status: 'published' });
      return all.slice(0, 2);
    },
  });

  const quickActions = [
    { icon: ShoppingBag, label: 'Shop Products', page: 'Shop', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Truck, label: 'My Orders', page: 'MyOrders', color: 'bg-blue-50 text-blue-600' },
    { icon: Wallet, label: 'My Earnings', page: 'PlasticEarnings', color: 'bg-purple-50 text-purple-600' },
    { icon: BookOpen, label: 'Learn', page: 'Learn', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="pb-24 lg:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-8 text-white">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-6 h-6" />
            <span className="font-semibold">IGA Recycling</span>
          </div>
          <h1 className="text-2xl font-bold mt-4">
            {user ? `Hello, ${user.full_name?.split(' ')[0] || 'there'}!` : 'Welcome!'}
          </h1>
          <p className="text-emerald-100 mt-2">
            Shop sustainable products made from recycled plastic
          </p>
          <Link to={createPageUrl('Shop')}>
            <Button className="mt-4 bg-white text-emerald-700 hover:bg-emerald-50">
              Browse Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        {/* Quick Actions */}
        <Card className="p-2 bg-white border-0 shadow-md rounded-2xl">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.page}
                to={createPageUrl(action.page)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2.5 rounded-xl ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* User's Plastic Balance */}
        {user?.plastic_balance > 0 && (
          <Card className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 border-0 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Your Plastic Earnings</p>
                <p className="text-2xl font-bold mt-1">
                  KES {user.plastic_balance?.toLocaleString()}
                </p>
              </div>
              <Link to={createPageUrl('PlasticEarnings')}>
                <Button variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30">
                  View
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Featured Products */}
        {products.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Featured Products</h2>
              <Link to={createPageUrl('Shop')} className="text-sm text-emerald-600 font-medium">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <Link key={product.id} to={createPageUrl('Shop')}>
                  <Card className="bg-white border-0 shadow-sm overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        KES {product.price?.toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Learn Section */}
        {posts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Learn & Discover</h2>
              <Link to={createPageUrl('Learn')} className="text-sm text-emerald-600 font-medium">
                See all
              </Link>
            </div>
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="p-4 bg-white border-0 shadow-sm">
                  <div className="flex gap-4">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-emerald-600 font-medium capitalize">
                        {post.category?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                        {post.title}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <Card className="p-5 bg-gray-900 border-0 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-xl">
              <Recycle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Sell Your Plastic</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Earn money by recycling plastic waste
              </p>
            </div>
          </div>
          <Link to={createPageUrl('PlasticEarnings')}>
            <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
              Learn More
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}