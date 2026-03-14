import { useState, useEffect } from 'react';
import { usePOS, Product } from '../contexts/POSContext';
import { apiClient, IS_DEVELOPMENT } from '../config/api';
import { Plus, Loader2, AlertCircle, Wine, Bed } from 'lucide-react';

// Extended product interface to support bar items
interface BarProduct extends Product {
  inventory_type?: 'bar';
  current_stock?: number;
  unit?: string;
}

let barItemsCache: BarProduct[] | null = null;

// Centralized currency formatter
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return 'KES 0';
  }
  return `KES ${numAmount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

interface QuickBarSalesPanelProps {
  isQuickAccess?: boolean;
}

export default function QuickBarSalesPanel({ isQuickAccess = true }: QuickBarSalesPanelProps) {
  const { addItemToOrder } = usePOS();
  // Initialize state directly from the cache
  const [barItems, setBarItems] = useState<BarProduct[]>(barItemsCache || []);
  const [filteredItems, setFilteredItems] = useState<BarProduct[]>(barItemsCache || []);
  const [searchTerm, setSearchTerm] = useState('');
  // Always set isLoading to true on mount to ensure fetchBarItems runs and completes
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  useEffect(() => {
    fetchBarItems();
    fetchActiveRooms();
  }, []);

  const fetchActiveRooms = async () => {
    try {
      const response = await apiClient.get('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        // Only show occupied rooms for charging
        setRooms(data.filter((r: any) => r.status === 'occupied'));
      }
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  };

  const fetchBarItems = async (force = false) => {
    if (!force && barItemsCache) {
      setBarItems(barItemsCache);
      setFilteredItems(barItemsCache);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (IS_DEVELOPMENT) {
        console.log('📱 Fetching bar items for Quick POS...');
      }

      const response = await apiClient.get('/api/quick-pos/bar-items-as-products');

      if (!response.ok) {
        throw new Error('Failed to fetch bar items. Please try again.');
      }

      const data = await response.json();

      if (IS_DEVELOPMENT) {
        console.log('✅ Bar items loaded:', data.length);
      }

      barItemsCache = data;
      setBarItems(data);
      setFilteredItems(data);
    } catch (err) {
      if (IS_DEVELOPMENT) {
        console.error('❌ Failed to fetch bar items:', err);
      }
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(barItems);
      return;
    }

    const filtered = barItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.unit && item.unit.toLowerCase().includes(searchLower))
      );
    });
    setFilteredItems(filtered);
  }, [searchTerm, barItems]);

  const handleAddItem = (item: BarProduct) => {
    // Convert bar item to Product format for adding to order
    const productToAdd: Product = {
      id: item.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description,
      price: item.price,
      is_available: item.is_available,
      preparation_time: item.preparation_time,
      image_url: item.image_url,
      inventory_item_id: item.inventory_item_id || item.id, // Ensure ID is passed
      source: 'bar'
    };

    // If a room is selected, we change the order type to room_service
    const orderType = selectedRoomId ? 'room_service' : 'bar_sale';

    addItemToOrder(productToAdd, 1, orderType, selectedRoomId || undefined);
  };

  const hasData = barItems.length > 0;

  return (
    <div className="flex-1 p-2 sm:p-3 lg:p-5">
      {/* Search Bar & Room Selector */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search bar items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            disabled={isLoading && !hasData}
          />
        </div>

        {/* Room Selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 min-w-[200px]">
          <Bed className="w-4 h-4 text-gray-500" />
          <select 
            className="text-sm bg-transparent border-none focus:ring-0 flex-1 cursor-pointer"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
          >
            <option value="">Direct Sale (Cash/Mpesa)</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                Room {room.room_number} - {room.guest_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && !hasData && (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        </div>
      )}

      {error && !hasData ? (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <div className="text-center text-red-500">
            <p className="font-semibold mb-2">Error loading bar items</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchBarItems(true)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && hasData && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1 text-sm text-red-700">
                <p className="font-semibold text-red-800">Error loading bar items</p>
                <p>{error}</p>
              </div>
              <button
                onClick={() => fetchBarItems(true)}
                className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && !hasData && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center text-gray-500">
                <p className="font-semibold mb-2">No bar items available</p>
                <p className="text-sm">No packaged products available for sale at the moment.</p>
              </div>
            </div>
          )}

          {hasData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      bg-white rounded-lg shadow-sm border overflow-hidden transition-all group
                      ${item.is_available
                        ? 'border-green-200 hover:shadow-lg hover:border-yellow-400 cursor-pointer'
                        : 'border-red-200 opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center overflow-hidden relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Wine className="w-10 h-10 text-amber-600" />
                      )}
                      {item.current_stock !== undefined && (
                        <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          {item.current_stock} {item.unit}
                        </div>
                      )}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm text-center">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="p-1.5">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-[10px] leading-snug">{item.name}</h3>
                      <p className="text-[9px] text-gray-500 mb-1 line-clamp-1">{item.unit}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-yellow-600 text-xs">{formatCurrency(item.price)}</span>
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={!item.is_available}
                          className={`
                            p-1 rounded-md transition-all
                            ${item.is_available
                              ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 active:scale-95'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                          `}
                          title={item.is_available ? 'Add to order' : 'Out of stock'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && searchTerm && (
                <div className="text-center text-gray-500 py-12">
                  <p className="font-semibold">No items found matching "{searchTerm}"</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Help text for Quick Access mode */}
      {isQuickAccess && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Add bar items to your order. PIN validation will be required at checkout.
          </p>
        </div>
      )}
    </div>
  );
}