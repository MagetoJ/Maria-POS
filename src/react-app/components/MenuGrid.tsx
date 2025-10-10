import { useState, useEffect } from 'react';
import { usePOS, Product, Category } from '@/react-app/contexts/POSContext';
import { formatCurrency } from '@/react-app/data/mockData';
import { Plus, Clock } from 'lucide-react';
import { getApiUrl } from '@/config/api';

export default function MenuGrid() {
  const { addItemToOrder } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // --- FETCH PRODUCTS & CATEGORIES FROM BACKEND ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(getApiUrl('/api/products'));
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(getApiUrl('/api/categories'));
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  // --- FILTER PRODUCTS ---
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory && product.is_available)
    : products.filter((product) => product.is_available);

  // --- FALLBACK EMOJI FOR CATEGORIES ---
  const getCategoryEmoji = (categoryId: number) => {
    switch (categoryId) {
      case 1: return '🥗';
      case 2: return '🍽️';
      case 3: return '🥤';
      case 4: return '🍰';
      default: return '🏨';
    }
  };

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
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class='text-4xl'>${getCategoryEmoji(product.category_id)}</div>`;
                  }}
                />
              ) : (
                <div className="text-4xl">{getCategoryEmoji(product.category_id)}</div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{product.preparation_time} min</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(product.price ?? 0)}
                </span>
                <button
                  onClick={() => addItemToOrder(product)}
                  className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items available in this category</p>
        </div>
      )}
    </div>
  );
}
