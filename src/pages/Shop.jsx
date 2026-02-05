import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EmptyState from '@/components/ui/EmptyState';

export default function Shop() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['shop-products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }),
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory && product.stock_quantity > 0;
  });

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: 1,
        image_url: product.image_url,
      }]);
    }
    setSelectedProduct(null);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    // Store cart in sessionStorage and navigate to checkout
    sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
    navigate(createPageUrl('Checkout'));
  };

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-100 sticky top-14 lg:top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 rounded-xl h-11"
            />
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2.5 bg-gray-900 text-white rounded-xl"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mt-3 overflow-x-auto -mx-4 px-4">
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
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-white border-0 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No products found"
            description="Check back later for new arrivals"
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="bg-white border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-square bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-semibold text-gray-900">
                      KES {product.price?.toLocaleString()}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          {selectedProduct && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium capitalize">{selectedProduct.category}</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">{selectedProduct.name}</h2>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  KES {selectedProduct.price?.toLocaleString()}
                </p>
              </div>
              {selectedProduct.description && (
                <p className="text-sm text-gray-600">{selectedProduct.description}</p>
              )}
              <div className="pt-4">
                <Button
                  onClick={() => addToCart(selectedProduct)}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart ({cartCount} items)</SheetTitle>
          </SheetHeader>
          
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 mt-4">Your cart is empty</p>
              <Button
                variant="outline"
                onClick={() => setShowCart(false)}
                className="mt-4"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-900 mt-1">
                        KES {item.unit_price?.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateCartQuantity(item.product_id, -1)}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, 1)}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="ml-auto p-1 text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>KES {cartTotal.toLocaleString()}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Checkout • KES {cartTotal.toLocaleString()}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}