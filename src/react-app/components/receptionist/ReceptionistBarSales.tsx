import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';

// Define types for clarity
interface BarItem {
  id: number;
  name: string;
  current_stock: number;
  cost_per_unit: number;
  unit: string;
}

interface SaleModalData {
  item: BarItem;
  quantity: number;
  paymentMethod: 'cash' | 'card' | 'mpesa';
}

export default function ReceptionistBarSales() {
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [saleModal, setSaleModal] = useState<SaleModalData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBarItems = async () => {
    try {
      const response = await apiClient.get('/api/inventory');
      if (response.ok) {
        const allItems = await response.json();
        setBarItems(allItems.filter((item: any) => item.inventory_type === 'bar'));
      }
    } catch (error) {
      console.error("Failed to fetch bar items", error);
    }
  };

  useEffect(() => {
    fetchBarItems();
  }, []);

  const handleSellItem = async () => {
    if (!saleModal) return;

    try {
      const response = await apiClient.post('/api/receptionist/sell-item', {
        inventory_item_id: saleModal.item.id,
        quantity: saleModal.quantity,
        unit_price: saleModal.item.cost_per_unit, // Using cost_per_unit as sale price, adjust if needed
        payment_method: saleModal.paymentMethod,
      });

      if (response.ok) {
        alert('Sale successful!');
        setSaleModal(null);
        fetchBarItems(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`Sale failed: ${errorData.message}`);
      }
    } catch (error) {
      alert('An error occurred during the sale.');
      console.error("Sale error", error);
    }
  };
  
  const filteredItems = barItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Sell Bar Items</h2>
      <input
        type="text"
        placeholder="Search for an item..."
        className="w-full max-w-md px-4 py-2 border rounded-lg mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="border p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <p className="font-bold text-lg">{item.name}</p>
            <p className="text-sm text-gray-600">Stock: {item.current_stock} {item.unit}(s)</p>
            <button
              onClick={() => setSaleModal({ item, quantity: 1, paymentMethod: 'cash' })}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              disabled={item.current_stock === 0}
            >
              Sell
            </button>
          </div>
        ))}
      </div>

      {/* Sale Modal */}
      {saleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Sell {saleModal.item.name}</h3>
            
            <label className="block mb-2 font-medium">Quantity:</label>
            <input
              type="number"
              min="1"
              max={saleModal.item.current_stock}
              value={saleModal.quantity}
              onChange={(e) => setSaleModal({ ...saleModal, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md mb-4"
            />

            <label className="block mb-2 font-medium">Payment Method:</label>
            <select
              value={saleModal.paymentMethod}
              onChange={(e) => setSaleModal({ ...saleModal, paymentMethod: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md mb-6"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mpesa">M-Pesa</option>
            </select>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSaleModal(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
              <button onClick={handleSellItem} className="px-4 py-2 bg-green-600 text-white rounded-md">Confirm Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}