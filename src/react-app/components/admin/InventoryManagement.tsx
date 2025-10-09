import { useState } from 'react';
import { Package, Plus, Edit3, Trash2, AlertTriangle } from 'lucide-react';

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

const mockInventory: InventoryItem[] = [
  { id: 1, name: 'Rice (White)', unit: 'kg', current_stock: 25, minimum_stock: 10, cost_per_unit: 120, supplier: 'Nakumatt Wholesale', inventory_type: 'kitchen', is_active: true, last_updated: '2024-10-08T14:30:00Z' },
  { id: 2, name: 'Beef (Fresh)', unit: 'kg', current_stock: 8, minimum_stock: 15, cost_per_unit: 800, supplier: 'Farmers Choice', inventory_type: 'kitchen', is_active: true, last_updated: '2024-10-09T08:15:00Z' },
  { id: 3, name: 'Tusker Beer', unit: 'bottles', current_stock: 48, minimum_stock: 24, cost_per_unit: 180, supplier: 'EABL', inventory_type: 'bar', is_active: true, last_updated: '2024-10-09T10:00:00Z' },
  { id: 4, name: 'Toilet Paper', unit: 'rolls', current_stock: 15, minimum_stock: 20, cost_per_unit: 50, supplier: 'Softcare', inventory_type: 'housekeeping', is_active: true, last_updated: '2024-10-08T16:45:00Z' },
  { id: 5, name: 'Tomatoes', unit: 'kg', current_stock: 12, minimum_stock: 8, cost_per_unit: 80, supplier: 'Local Market', inventory_type: 'kitchen', is_active: true, last_updated: '2024-10-09T07:30:00Z' },
  { id: 6, name: 'Red Wine', unit: 'bottles', current_stock: 6, minimum_stock: 12, cost_per_unit: 1200, supplier: 'Wine Cellar Ltd', inventory_type: 'bar', is_active: true, last_updated: '2024-10-07T15:20:00Z' },
  { id: 7, name: 'Towels', unit: 'pieces', current_stock: 35, minimum_stock: 25, cost_per_unit: 350, supplier: 'Hotel Supplies Co.', inventory_type: 'housekeeping', is_active: true, last_updated: '2024-10-06T12:10:00Z' },
  { id: 8, name: 'Coca Cola', unit: 'bottles', current_stock: 72, minimum_stock: 36, cost_per_unit: 60, supplier: 'Coca Cola Co.', inventory_type: 'bar', is_active: true, last_updated: '2024-10-09T11:30:00Z' },
];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    supplier: '',
    inventory_type: 'kitchen' as 'kitchen' | 'bar' | 'housekeeping' | 'minibar'
  });

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

  const handleAdd = () => {
    const newItem: InventoryItem = {
      id: Date.now(),
      ...formData,
      is_active: true,
      last_updated: new Date().toISOString()
    };

    setInventory(prev => [...prev, newItem]);
    resetForm();
    setShowAddModal(false);
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
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    
    setInventory(prev => prev.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...formData, last_updated: new Date().toISOString() }
        : item
    ));
    
    setEditingItem(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      setInventory(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateStock = (id: number, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id 
        ? { ...item, current_stock: Math.max(0, newStock), last_updated: new Date().toISOString() }
        : item
    ));
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
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

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

      {/* Inventory Table */}
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
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateStock(item.id, item.current_stock + 1)}
                        className="w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center text-xs font-bold"
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
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
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

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="kg, bottles, pieces"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.inventory_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (editingItem) {
                    setEditingItem(null);
                  } else {
                    setShowAddModal(false);
                  }
                  resetForm();
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdate : handleAdd}
                disabled={!formData.name || !formData.unit || !formData.supplier}
                className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
