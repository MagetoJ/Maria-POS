import { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { API_URL } from '@/config/api';  // ← ADD THIS

// ← ADD THIS FUNCTION
const formatCurrency = (amount: number): string => {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  cost_per_unit: number;
  supplier: string;
  inventory_type: 'kitchen' | 'bar' | 'housekeeping' | 'minibar';
  is_active: boolean;
  last_updated: string;
}

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    supplier: '',
    inventory_type: 'kitchen' as 'kitchen' | 'bar' | 'housekeeping' | 'minibar'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pos_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch inventory' }));
        setError(errorData.message || 'Failed to fetch inventory');
        console.error("Failed to fetch inventory:", errorData);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const inventoryTypes = [
    { value: 'kitchen', label: 'Kitchen', color: 'bg-green-100 text-green-800' },
    { value: 'bar', label: 'Bar', color: 'bg-blue-100 text-blue-800' },
    { value: 'housekeeping', label: 'Housekeeping', color: 'bg-purple-100 text-purple-800' },
    { value: 'minibar', label: 'Minibar', color: 'bg-orange-100 text-orange-800' }
  ];

  const filteredInventory = selectedType === 'all'
    ? inventory
    : inventory.filter(item => item.inventory_type === selectedType);

  const lowStockItems = inventory.filter(item => item.current_stock <= item.minimum_stock);
  const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0);

  const handleAdd = async () => {
    if (!formData.name || !formData.unit || !formData.supplier) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pos_token');
      const response = await fetch(`${API_URL}/api/inventory`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchInventory();
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add item' }));
        setError(errorData.message || 'Failed to add inventory item');
        console.error('Add error:', errorData);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Add error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      cost_per_unit: item.cost_per_unit,
      supplier: item.supplier,
      inventory_type: item.inventory_type
    });
    setShowAddModal(true);
    setError(null);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    if (!formData.name || !formData.unit || !formData.supplier) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pos_token');
      const response = await fetch(`${API_URL}/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchInventory();
        setEditingItem(null);
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update item' }));
        setError(errorData.message || 'Failed to update inventory item');
        console.error('Update error:', errorData);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pos_token');
      const response = await fetch(`${API_URL}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchInventory();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete item' }));
        setError(errorData.message || 'Failed to delete inventory item');
        console.error('Delete error:', errorData);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: number, newStock: number) => {
    setError(null);
    try {
      const token = localStorage.getItem('pos_token');
      const response = await fetch(`${API_URL}/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ current_stock: Math.max(0, newStock) })
      });

      if (response.ok) {
        await fetchInventory();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update stock' }));
        setError(errorData.message || 'Failed to update stock');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Stock update error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      current_stock: 0,
      minimum_stock: 0,
      cost_per_unit: 0,
      supplier: '',
      inventory_type: 'kitchen'
    });
    setError(null);
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'text-red-600';
    if (item.current_stock <= item.minimum_stock) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeColor = (type: string) => {
    const typeConfig = inventoryTypes.find(t => t.value === type);
    return typeConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number): string => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Track stock levels and manage suppliers</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-medium transition-colors"
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{inventory.length}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          <div className="text-sm text-gray-600">Low Stock Alerts</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
          <div className="text-sm text-gray-600">Total Inventory Value</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{inventory.filter(i => i.inventory_type === 'kitchen').length}</div>
          <div className="text-sm text-gray-600">Kitchen Items</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items ({inventory.length})
          </button>
          {inventoryTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label} ({inventory.filter(i => i.inventory_type === type.value).length})
            </button>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white rounded-md p-3 border border-yellow-200">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">
                  Current: <span className="text-red-600 font-semibold">{item.current_stock} {item.unit}</span>
                  <span className="mx-2">•</span>
                  Min: {item.minimum_stock} {item.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Inventory Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">Per {item.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.inventory_type)}`}>
                        {inventoryTypes.find(t => t.value === item.inventory_type)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-semibold ${getStockStatusColor(item)}`}>
                          {item.current_stock} {item.unit}
                        </div>
                        {item.current_stock <= item.minimum_stock && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minimum_stock} {item.unit}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => updateStock(item.id, item.current_stock - 1)}
                          className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center text-xs font-bold"
                          disabled={loading}
                        >
                          -
                        </button>
                        <button
                          onClick={() => updateStock(item.id, item.current_stock + 1)}
                          className="w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center text-xs font-bold"
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatCurrency(item.cost_per_unit)}</div>
                      <div className="text-xs text-gray-500">
                        Total: {formatCurrency(item.current_stock * item.cost_per_unit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.last_updated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={loading}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="kg, bottles, pieces"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.inventory_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {inventoryTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (KES)</label>
                <input
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdate : handleAdd}
                disabled={!formData.name || !formData.unit || !formData.supplier || loading}
                className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}