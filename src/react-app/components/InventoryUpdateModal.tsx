import { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Package, X } from 'lucide-react';

// Define the type for the inventory item this modal will receive
interface InventoryItem {
  id: number;
  name: string;
  current_stock: number;
}

// Define the props for the modal component
interface InventoryUpdateModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryUpdateModal({ item, onClose, onSuccess }: InventoryUpdateModalProps) {
  const [newStock, setNewStock] = useState(item.current_stock);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to reset stock value if the item being edited changes
  useEffect(() => {
    setNewStock(item.current_stock);
  }, [item]);

  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/api/inventory/${item.id}/stock`, {
        current_stock: newStock,
      });

      if (response.ok) {
        onSuccess(); // Notify parent component of success
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update stock.');
      }
    } catch (err) {
      setError('An network error occurred. Please try again.');
      console.error('Stock update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <Package className="text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Update Stock</h3>
        </div>
        
        <p className="mb-4 text-gray-600">
          Editing stock for: <span className="font-semibold text-gray-900">{item.name}</span>
        </p>

        <label htmlFor="stock-input" className="block mb-2 text-sm font-medium text-gray-700">
          New Stock Count
        </label>
        <input
          id="stock-input"
          type="number"
          value={newStock}
          onChange={(e) => setNewStock(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter new stock quantity"
        />

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
