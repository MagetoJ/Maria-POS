import { useState } from 'react';
import { usePOS } from '@/react-app/contexts/POSContext';
import { mockCategories, mockProducts, formatCurrency } from '@/react-app/data/mockData';
import { Plus, Clock } from 'lucide-react';

export default function MenuGrid() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { addItemToOrder } = usePOS();

  const filteredProducts = selectedCategory 
    ? mockProducts.filter(product => product.category_id === selectedCategory && product.is_available)
    : mockProducts.filter(product => product.is_available);

  return (
    <div className="flex-1 p-6">
      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          All Items
        </button>
        {mockCategories.filter(cat => cat.is_active).map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    // Fallback to emoji if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class="text-4xl">${
                      product.category_id === 1 ? '🥗' : 
                      product.category_id === 2 ? '🍽️' : 
                      product.category_id === 3 ? '🥤' : 
                      product.category_id === 4 ? '🍰' : '🏨'
                    }</div>`;
                  }}
                />
              ) : (
                <div className="text-4xl">
                  {product.category_id === 1 ? '🥗' : 
                   product.category_id === 2 ? '🍽️' : 
                   product.category_id === 3 ? '🥤' : 
                   product.category_id === 4 ? '🍰' : '🏨'}
                </div>
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
                  {formatCurrency(product.price)}
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
