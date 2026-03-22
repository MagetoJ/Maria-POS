import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Check, AlertCircle, Info, Utensils, Search, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: number;
  is_bar_item?: boolean;
  in_stock?: boolean;
  stock_level?: number;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  total_price: number;
}

export default function QRMenuOrdering() {
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPublicMenu();
  }, []);

  const fetchPublicMenu = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/public/menu/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }
      
      const data = await response.json();
      setGroupedProducts(data);
      
      const categories = Object.keys(data);
      if (categories.length > 0 && activeCategory === 'All') {
        // Keep 'All' as an option or set to first category
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load menu');
      console.error('Error fetching public menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllProducts = () => {
    return Object.values(groupedProducts).flat();
  };

  const getFilteredProducts = () => {
    let products = activeCategory === 'All' 
      ? getAllProducts() 
      : groupedProducts[activeCategory] || [];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }
    
    return products;
  };

  const addToCart = (product: Product) => {
    if (product.in_stock === false) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.price
              }
            : item
        );
      }
      
      return [...prevCart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total_price: product.price
      }];
    });
  };

  const updateQuantity = (productId: number, change: number) => {
    setCart(prevCart =>
      prevCart
        .map(item =>
          item.product_id === productId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + change),
                total_price: Math.max(0, item.quantity + change) * item.price
              }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setError('Please add items to your order');
      return;
    }

    if (!tableNumber) {
      setError('Please enter your table number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderPayload = {
        items: cart,
        order_type: 'self_service',
        payment_method: selectedPaymentMethod,
        subtotal: calculateTotal(),
        total_amount: calculateTotal(),
        service_charge: 0,
        status: 'pending',
        table_number: tableNumber,
        special_instructions: specialInstructions
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit order');
      }

      const data = await response.json();
      setSuccessMessage(`✅ Order #${data.order_number} submitted successfully! Our team will prepare it soon.`);
      setCart([]);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit order');
      console.error('Error submitting order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading our delicious menu...</p>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Object.keys(groupedProducts)];
  const productsToDisplay = getFilteredProducts();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      {/* Hero Header */}
      <div className="relative bg-yellow-500 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-12 -mt-12 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 -ml-8 -mb-8 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">MOCHA POS</h1>
            <p className="text-yellow-50 max-w-md mx-auto">Welcome to our digital menu! Order directly from your table for a seamless dining experience.</p>
            
            <div className="mt-4 w-full max-w-xs">
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter Table Number (e.g., T-12)"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-white outline-none text-center font-bold text-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex-shrink-0 p-2.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearchQuery(''); // Clear search when switching categories
                    // Scroll slightly down on mobile when picking category
                    if (window.innerWidth < 768) {
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }
                  }}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 transform active:scale-95 ${
                    activeCategory === cat && !searchQuery
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        {searchQuery && (
          <div className="px-4 pb-2 pt-0 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>Showing results for: <b>"{searchQuery}"</b></span>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-yellow-600 font-bold p-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium text-sm">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-4 text-green-700 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-green-500 rounded-full p-1 text-white flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Success!</p>
                  <p className="text-sm opacity-90 leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {productsToDisplay.length > 0 ? (
                productsToDisplay.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex h-40 border border-gray-100 group"
                  >
                    <div className="w-36 h-full bg-gray-50 flex-shrink-0 relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <Utensils className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                        {product.is_bar_item && (
                          <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm">
                            BAR
                          </span>
                        )}
                        {!product.in_stock && product.is_bar_item && (
                          <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm">
                            OUT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-base leading-tight group-hover:text-yellow-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {product.description || 'Delightfully prepared with fresh ingredients.'}
                        </p>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-tighter">Price</span>
                          <span className="text-lg font-black text-yellow-500">
                            {product.price.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.in_stock === false && product.is_bar_item}
                          className={`p-3 rounded-xl transition-all duration-300 transform active:scale-90 shadow-lg ${
                            product.in_stock === false && product.is_bar_item
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:-translate-y-1 shadow-yellow-200'
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">No items found</h3>
                  <p className="text-gray-400 max-w-xs mx-auto text-sm mt-1">Try selecting another category or check back later!</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 lg:sticky lg:top-24 hidden lg:block">
              <CartContent 
                cart={cart} 
                total={total} 
                updateQuantity={updateQuantity} 
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                handleSubmitOrder={handleSubmitOrder}
                isSubmitting={isSubmitting}
                specialInstructions={specialInstructions}
                setSpecialInstructions={setSpecialInstructions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-8 right-6 bg-yellow-500 text-white p-5 rounded-full shadow-2xl shadow-yellow-500/50 z-50 animate-bounce active:scale-90"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-yellow-500 font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
        </button>
      )}

      {/* Mobile Cart Modal/Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" onClick={() => setIsCartOpen(false)}></div>
            <CartContent 
                cart={cart} 
                total={total} 
                updateQuantity={updateQuantity} 
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                handleSubmitOrder={handleSubmitOrder}
                isSubmitting={isSubmitting}
                specialInstructions={specialInstructions}
                setSpecialInstructions={setSpecialInstructions}
                onComplete={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search for dishes, drinks..." 
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsSearchOpen(false);
                }}
              />
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchQuery.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Search Results</p>
                  {getFilteredProducts().length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {getFilteredProducts().slice(0, 8).map(product => (
                        <div 
                          key={product.id}
                          onClick={() => {
                            // Find the category of this product to highlight it if needed
                            // But for now just close the modal and show results
                            setIsSearchOpen(false);
                            // Scroll to the product grid if needed
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="flex items-center gap-4 p-3 hover:bg-yellow-50 rounded-2xl cursor-pointer transition-colors group"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Utensils className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 group-hover:text-yellow-700">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.price.toLocaleString()} • {product.is_bar_item ? 'Bar' : 'Menu'}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className="p-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-500 hover:text-white transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-gray-400 text-sm">No results for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm italic">Type something to search our menu...</p>
                </div>
              )}
            </div>
            
            {searchQuery.length > 0 && getFilteredProducts().length > 0 && (
              <div className="p-4 bg-gray-50 border-t">
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="w-full py-3 bg-yellow-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-200 active:scale-95 transition-all"
                >
                  View All {getFilteredProducts().length} Results
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CartContent({ 
  cart, 
  total, 
  updateQuantity, 
  selectedPaymentMethod, 
  setSelectedPaymentMethod, 
  handleSubmitOrder, 
  isSubmitting,
  specialInstructions,
  setSpecialInstructions,
  onComplete
}: any) {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2.5 rounded-xl text-white shadow-lg shadow-yellow-100">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Order</h2>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-gray-200" />
          </div>
          <p className="text-gray-400 font-medium">Your cart is currently empty</p>
          <p className="text-xs text-gray-300 mt-1">Start adding some items!</p>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-8 max-h-[35vh] overflow-y-auto pr-3 custom-scrollbar">
            {cart.map((item: any) => (
              <div key={item.product_id} className="flex items-center justify-between group">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm group-hover:text-yellow-600 transition-colors">{item.name}</p>
                  <p className="text-xs text-gray-400 font-black mt-0.5">
                    {item.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-red-500 hover:bg-red-50 transition-all active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-black text-gray-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-green-500 hover:bg-green-50 transition-all active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="E.g. No onions, extra spice, etc."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-yellow-500 outline-none transition-all resize-none h-24"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'CASH' },
                  { id: 'card', label: 'CARD' },
                  { id: 'mobile_money', label: 'MPESA' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`py-3 px-1 rounded-xl text-[10px] font-black border-2 transition-all duration-300 ${
                      selectedPaymentMethod === method.id
                        ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-100 scale-105'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-yellow-100 hover:text-yellow-600'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-100 pt-6 mb-8">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                <span className="text-4xl font-black text-yellow-500 tracking-tighter italic">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await handleSubmitOrder();
              if (onComplete) onComplete();
            }}
            disabled={isSubmitting || cart.length === 0}
            className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-yellow-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10"></div>
            {isSubmitting ? (
              <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <span className="group-hover:text-white transition-colors">COMPLETE MY ORDER</span>
                <div className="bg-white/20 p-1 rounded-md">
                   <Check className="w-5 h-5" />
                </div>
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-4 font-bold tracking-tight">By clicking complete, your order is sent to the kitchen instantly.</p>
        </>
      )}
    </>
  );
}

