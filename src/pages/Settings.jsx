import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, 
  Users, 
  Package, 
  ClipboardList, 
  BookOpen,
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
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

  const handleLogout = () => {
    base44.auth.logout();
  };

  const menuItems = [
    {
      title: 'Data Management',
      items: [
        { icon: Users, label: 'Customers', page: 'Customers', description: 'Manage customer database' },
        { icon: Package, label: 'Products', page: 'Products', description: 'Product catalog' },
        { icon: ClipboardList, label: 'Inventory', page: 'Inventory', description: 'Stock management' },
        { icon: BookOpen, label: 'Educational Posts', page: 'EducationalPosts', description: 'Manage content' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', toggle: true },
        { icon: Shield, label: 'Security', page: 'Profile' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance' },
      ]
    },
  ];

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* User Profile Card */}
        {user && (
          <Card className="p-4 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-600">
                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-emerald-600 font-medium capitalize mt-1">{user.role}</p>
              </div>
              <Link to={createPageUrl('Profile')}>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </Card>
        )}

        {/* Menu Sections */}
        {menuItems.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
              {section.title}
            </h2>
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  item.toggle ? (
                    <div key={item.label} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <item.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <Switch />
                    </div>
                  ) : item.page ? (
                    <Link key={item.label} to={createPageUrl(item.page)}>
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <item.icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ) : (
                    <div key={item.label} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <item.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  )
                ))}
              </div>
            </Card>
          </div>
        ))}

        {/* Logout */}
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full text-left hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm font-medium text-red-600">Sign Out</p>
          </button>
        </Card>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 mt-6">
          IGA Operations v1.0.0
        </p>
      </div>
    </div>
  );
}