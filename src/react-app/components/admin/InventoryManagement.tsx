import { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, Search, AlertTriangle, History, RefreshCw } from 'lucide-react';
import { apiClient } from '../../config/api';

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  cost_per_unit: number;
  selling_price: number;
  supplier: string;
  inventory_type: 'kitchen' | 'bar' | 'housekeeping' | 'minibar';
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface InventoryLog {
  id: number;
  inventory_item_id: number;
  item_name: string;
  action: string;
  quantity_change: number;
  reference_id?: number;
  reference_type?: string;
  logged_by: number;
  staff_name: string;
  notes: string;
  created_at: string;
}

const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return 'KES 0';
  }
  return `KES ${numAmount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'logs'>('items');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [form, setForm] = useState({
    name: '',
    unit: '',
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    selling_price: 0,
    supplier: '',
    inventory_type: 'kitchen' as InventoryItem['inventory_type'],
    image_url: ''
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/inventory?type=${selectedType}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await apiClient.get('/api/inventory/log');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory logs:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'items') {
      fetchItems();
    } else {
      fetchLogs();
    }
  }, [activeTab, selectedType]);

  const handleAddItem = async () => {
    if (!form.name || !form.unit) {
      alert('Name and Unit are required');
      return;
    }

    try {
      const response = await apiClient.post('/api/inventory', form);
      if (response.ok) {
        fetchItems();
        setShowAddModal(false);
        resetForm();
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const response = await apiClient.put(`/api/inventory/${editingItem.id}`, form);
      if (response.ok) {
        fetchItems();
        setShowAddModal(false);
        setEditingItem(null);
        resetForm();
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await apiClient.delete(`/api/inventory/${id}`);
      if (response.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      cost_per_unit: item.cost_per_unit,
      selling_price: item.selling_price || 0,
      supplier: item.supplier,
      inventory_type: item.inventory_type,
      image_url: item.image_url || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      unit: '',
      current_stock: 0,
      minimum_stock: 0,
      cost_per_unit: 0,
      selling_price: 0,
      supplier: '',
      inventory_type: 'kitchen',
      image_url: ''
    });
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Track and manage stock levels across all departments</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingItem(null); setShowAddModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'items' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Inventory Items
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'logs' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Stock History (Logs)
        </button>
      </div>

      {activeTab === 'items' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items or suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="kitchen">Kitchen</option>
              <option value="bar">Bar</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="minibar">Minibar</option>
            </select>
            <div className="flex items-center justify-end">
              <button 
                onClick={fetchItems}
                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Refresh inventory"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Stock Level</th>
                    <th className="px-6 py-4">Cost/Unit</th>
                    <th className="px-6 py-4">Selling Price</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Loading inventory data...</p>
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.unit}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{item.inventory_type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-bold ${item.current_stock <= item.minimum_stock ? 'text-red-600' : 'text-green-600'}`}>
                              {item.current_stock}
                            </span>
                            {item.current_stock <= item.minimum_stock && (
                              <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Low Stock</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(item.cost_per_unit)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-yellow-600">
                          {item.inventory_type === 'bar' ? formatCurrency(item.selling_price || 0) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.supplier || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No inventory items found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Change</th>
                  <th className="px-6 py-4">Staff</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length > 0 ? (
                  logs.map(log => (
                    <tr key={log.id} className="text-sm">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{log.item_name}</td>
                      <td className="px-6 py-4">
                        <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
                          log.action === 'sale' ? 'bg-green-100 text-green-700' :
                          log.action === 'wastage' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{log.staff_name}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{log.notes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      No stock history logs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Inventory Item'}</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit (e.g. Kg, Ltr, Pcs)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={form.unit}
                    onChange={(e) => setForm({...form, unit: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={form.inventory_type}
                    onChange={(e) => setForm({...form, inventory_type: e.target.value as any})}
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="bar">Bar</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="minibar">Minibar</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={form.current_stock}
                    onChange={(e) => setForm({...form, current_stock: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Alert</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={form.minimum_stock}
                    onChange={(e) => setForm({...form, minimum_stock: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Unit</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={form.cost_per_unit}
                    onChange={(e) => setForm({...form, cost_per_unit: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Bar Items)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={form.selling_price}
                    onChange={(e) => setForm({...form, selling_price: parseFloat(e.target.value) || 0})}
                    disabled={form.inventory_type !== 'bar'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  value={form.supplier}
                  onChange={(e) => setForm({...form, supplier: e.target.value})}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg transition-colors"
              >
                {editingItem ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
