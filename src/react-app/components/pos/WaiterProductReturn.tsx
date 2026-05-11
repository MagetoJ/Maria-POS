import React, { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import { 
  RotateCcw, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Package,
  History,
  Clock
} from 'lucide-react';
import { useToast } from '../Toast';

interface InventoryItem {
  id: number;
  name: string;
  current_stock: number;
  unit: string;
}

interface ProductReturn {
  id: number;
  inventory_name?: string;
  quantity_returned: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

export default function WaiterProductReturn() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recentReturns, setReturns] = useState<ProductReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  const [formData, setFormData] = useState({
    quantity: '1',
    reason: 'damaged',
    notes: ''
  });

  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, returnsRes] = await Promise.all([
        apiClient.get('/api/product-returns/data/inventory'),
        apiClient.get('/api/product-returns')
      ]);

      if (invRes.ok && returnsRes.ok) {
        setInventoryItems(await invRes.json());
        setReturns(await returnsRes.json());
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item => 
    (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/product-returns', {
        inventory_id: selectedItem.id,
        quantity_returned: parseInt(formData.quantity),
        reason: formData.reason,
        notes: formData.notes
      });

      if (response.ok) {
        toast.success('Return request submitted for Admin approval');
        setSelectedItem(null);
        setFormData({ quantity: '1', reason: 'damaged', notes: '' });
        fetchData();
        setActiveTab('history');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to submit return');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-100';
      case 'denied': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
        <p className="text-gray-500">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'new' ? 'text-yellow-600 bg-yellow-50/50 border-b-2 border-yellow-500' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <RotateCcw size={18} />
          New Return Request
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'history' ? 'text-yellow-600 bg-yellow-50/50 border-b-2 border-yellow-500' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <History size={18} />
          Request History
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'new' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">1. Select Item to Return</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search product name..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (selectedItem) setSelectedItem(null);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setSearchTerm(item.name);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                        selectedItem?.id === item.id 
                          ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500' 
                          : 'border-gray-100 hover:border-yellow-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedItem?.id === item.id ? 'bg-yellow-200' : 'bg-gray-100'}`}>
                          <Package size={18} className={selectedItem?.id === item.id ? 'text-yellow-700' : 'text-gray-500'} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">Current Stock: {item.current_stock} {item.unit}</p>
                        </div>
                      </div>
                      {selectedItem?.id === item.id && <CheckCircle2 className="text-yellow-600" size={20} />}
                    </button>
                  ))}
                  {searchTerm && filteredItems.length === 0 && (
                    <div className="p-4 text-center text-gray-400 italic">No matching items found</div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity duration-300 ${!selectedItem ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      >
                        <option value="damaged">Damaged</option>
                        <option value="expired">Expired</option>
                        <option value="wrong_item">Wrong Item</option>
                        <option value="quality_issue">Quality Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Explain why the product is being returned..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedItem}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-yellow-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <RotateCcw size={20} />}
                  Submit Return Request
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-4 px-4">Item</th>
                    <th className="pb-4 px-4">Qty</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentReturns.length > 0 ? (
                    recentReturns.map((ret) => (
                      <tr key={ret.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800">{ret.inventory_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{ret.reason.replace(/_/g, ' ')}</p>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-600">{ret.quantity_returned}</td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(ret.status)}`}>
                            {ret.status === 'pending' && <Clock size={10} />}
                            {ret.status === 'approved' && <CheckCircle2 size={10} />}
                            {ret.status === 'denied' && <AlertCircle size={10} />}
                            {ret.status}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-400">
                          {new Date(ret.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 italic">No return history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
