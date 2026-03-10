import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { apiClient } from '../../config/api';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock_level: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface KitchenInventoryViewProps {
  onClose?: () => void;
}

const KitchenInventoryView: React.FC<KitchenInventoryViewProps> = ({ onClose }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Assuming there's an endpoint for kitchen inventory or using general inventory
      const response = await apiClient.get('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full max-h-[80vh]">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Kitchen Inventory</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchInventory}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading inventory data...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  item.quantity <= item.min_stock_level 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    item.quantity <= item.min_stock_level ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {item.quantity} {item.unit}
                  </p>
                  {item.quantity <= item.min_stock_level && (
                    <div className="flex items-center gap-1 text-red-600 text-xs font-medium justify-end">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low Stock</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No inventory items found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenInventoryView;
