import { useState, useEffect } from 'react';
import { usePOS, Product, Category } from '../contexts/POSContext';
import { apiClient, IS_DEVELOPMENT } from '../config/api';
import { Plus, Clock, Loader2, Wine } from 'lucide-react';

// Extended product interface to support bar items
interface ExtendedProduct extends Product {
  is_bar_item?: boolean;
  current_stock?: number;
  unit?: string;
}

// --- Helper Function ---
const formatCurrency = (amount: number | string): string => {
  // Parse amount to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return 'KES 0';
  }
  return `KES ${numAmount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function MenuGrid() {
  const { addItemToOrder } = usePOS(); // Corrected: usePOS provides 'addToCart'

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch both products and categories from the backend when the component loads
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (IS_DEVELOPMENT) {
          console.log('📱 Fetching menu data (products & categories)...');
        }

        const [productsRes, categoriesRes, barItemsRes] = await Promise.all([
          apiClient.get('/api/products'),
          apiClient.get('/api/categories'),
          apiClient.get('/api/quick-pos/bar-items-as-products')
        ]);

        if (!productsRes.ok || !categoriesRes.ok || !barItemsRes.ok) {
          throw new Error('Failed to fetch menu data. Please try again.');
        }

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        const barItemsData = await barItemsRes.json();

        // Mark bar items and combine with regular products
        const barItemsWithFlag = barItemsData.map((item: any) => ({
          ...item,
          is_bar_item: true
        }));

        const allProducts = [...productsData, ...barItemsWithFlag];

        if (IS_DEVELOPMENT) {
          console.log('✅ Menu data loaded:', {
            products: productsData.length,
            barItems: barItemsData.length,
            total: allProducts.length,
            categories: categoriesData.length
          });
        }

        setProducts(allProducts);
        setCategories(categoriesData);
      } catch (err) {
        if (IS_DEVELOPMENT) {
          console.error('❌ Failed to fetch menu data:', err);
        }
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on the selected category
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory && product.is_available)
    : products.filter((product) => product.is_available);

  // Show a loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  // Show an error message if fetching fails
  if (error) {
    return <div className="text-center text-red-500 p-8">Error: {error}</div>;
  }

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6">
      {/* Category Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          All Items
        </button>
        {categories
          .filter((cat) => cat.is_active)
          .map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => addItemToOrder(product)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all group"
          >
            <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200"><span class="text-2xl font-bold text-yellow-600">${product.name.charAt(0)}</span></div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
                  {product.is_bar_item ? (
                    <Wine className="w-12 h-12 text-amber-600" />
                  ) : (
                    <span className="text-2xl font-bold text-yellow-600">{product.name.charAt(0)}</span>
                  )}
                </div>
              )}
              {/* Bar icon overlay for bar items */}
              {product.is_bar_item && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-md">
                  <Wine className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 h-10">{product.name}</h3>
              {product.is_bar_item && product.current_stock !== undefined && (
                <div className="flex items-center text-xs text-amber-600 mb-1">
                  <Wine className="w-3 h-3 mr-1" />
                  {product.current_stock} {product.unit} available
                </div>
              )}
              {product.preparation_time && product.preparation_time > 2 && (
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {product.preparation_time} min
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                <button className="w-8 h-8 bg-green-100 group-hover:bg-green-500 rounded-full flex items-center justify-center text-green-700 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items available in this category.</p>
        </div>
      )}
    </div>
  );
}