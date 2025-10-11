import { useState, useEffect } from 'react';
import { usePOS, Product, Category } from '../contexts/POSContext';
import { API_URL } from '../config/api';
import { Plus, Clock, Loader2 } from 'lucide-react';

// --- Helper Function ---
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number') {
    return 'KES 0';
  }
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function MenuGrid() {
  const { addItemToOrder } = usePOS(); // Corrected: usePOS provides 'addToCart'

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch both products and categories from the backend when the component loads
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/api/products`),
          fetch(`${API_URL}/api/categories`)
        ]);

        if (!productsRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch menu data. Please try again.');
        }

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
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
            <div className="aspect-square bg-gray-50 flex items-center justify-center">
              {/* Image would go here if available */}
              <span className="text-3xl text-gray-300">{product.name.charAt(0)}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 h-12">{product.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(product.price ?? 0)}
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