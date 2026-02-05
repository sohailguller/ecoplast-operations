import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  ClipboardList,
  Recycle,
  Factory,
  Settings,
  BookOpen,
  Home,
  Store,
  Truck,
  Wallet,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const adminNav = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
  { name: 'Orders', icon: ShoppingCart, page: 'Orders' },
  { name: 'Products', icon: Package, page: 'Products' },
  { name: 'Inventory', icon: ClipboardList, page: 'Inventory' },
  { name: 'Production', icon: Factory, page: 'Production' },
  { name: 'Collection', icon: Recycle, page: 'PlasticCollection' },
  { name: 'Customers', icon: Users, page: 'Customers' },
  { name: 'Staff', icon: Users, page: 'Staff' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

const staffNav = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'StaffDashboard' },
  { name: 'Tasks', icon: ClipboardList, page: 'StaffTasks' },
  { name: 'Production', icon: Factory, page: 'StaffProduction' },
  { name: 'Collection', icon: Recycle, page: 'StaffCollection' },
  { name: 'Profile', icon: User, page: 'Profile' },
];

const customerNav = [
  { name: 'Home', icon: Home, page: 'CustomerHome' },
  { name: 'Shop', icon: Store, page: 'Shop' },
  { name: 'Orders', icon: Truck, page: 'MyOrders' },
  { name: 'Earnings', icon: Wallet, page: 'PlasticEarnings' },
  { name: 'Learn', icon: BookOpen, page: 'Learn' },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Determine navigation based on user role
  const getNavigation = () => {
    if (!user) return customerNav;
    if (user.role === 'admin') return adminNav;
    if (user.staff_role) return staffNav;
    return customerNav;
  };

  const navigation = getNavigation();

  // Pages that don't need layout
  const noLayoutPages = ['Login', 'Register'];
  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">IGA</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`lg:hidden fixed top-14 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100">
          {user ? (
            <div>
              <p className="font-medium text-gray-900">{user.full_name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          ) : (
            <Link 
              to={createPageUrl('Login')}
              className="block text-sm font-medium text-emerald-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
        <nav className="p-2">
          {navigation.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900">IGA Operations</span>
            <p className="text-xs text-gray-500">Recycling Management</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          {user ? (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <button 
                onClick={handleLogout}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <Link 
              to={createPageUrl('Login')}
              className="block px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 px-2 pb-5 flex items-center justify-around z-40">
        {navigation.slice(0, 5).map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px] ${
                isActive ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}