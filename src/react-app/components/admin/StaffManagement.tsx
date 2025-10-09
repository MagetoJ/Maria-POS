import { useState } from 'react';
import { User, Plus, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';

interface Staff {
  id: number;
  employee_id: string;
  username: string;
  name: string;
  role: string;
  pin: string;
  password: string;
  is_active: boolean;
  created_at: string;
}

const mockStaff: Staff[] = [
  { id: 1, employee_id: 'EMP001', username: 'john.manager', name: 'John Manager', role: 'manager', pin: '1234', password: 'manager123', is_active: true, created_at: '2024-01-15T08:00:00Z' },
  { id: 2, employee_id: 'EMP002', username: 'mary.waiter', name: 'Mary Waiter', role: 'waiter', pin: '5678', password: 'waiter123', is_active: true, created_at: '2024-01-16T08:00:00Z' },
  { id: 3, employee_id: 'EMP003', username: 'james.cashier', name: 'James Cashier', role: 'cashier', pin: '9999', password: 'cashier123', is_active: true, created_at: '2024-01-17T08:00:00Z' },
  { id: 4, employee_id: 'EMP004', username: 'sarah.chef', name: 'Sarah Chef', role: 'kitchen_staff', pin: '1111', password: 'chef123', is_active: true, created_at: '2024-01-18T08:00:00Z' },
  { id: 5, employee_id: 'EMP005', username: 'admin', name: 'Admin User', role: 'admin', pin: '0000', password: 'admin123', is_active: true, created_at: '2024-01-10T08:00:00Z' },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>(mockStaff);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const [formData, setFormData] = useState({
    employee_id: '',
    username: '',
    name: '',
    role: 'waiter',
    pin: '',
    password: ''
  });

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'waiter', label: 'Waiter' },
    { value: 'kitchen_staff', label: 'Kitchen Staff' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'housekeeping', label: 'Housekeeping' }
  ];

  const generateEmployeeId = () => {
    const existingIds = staff.map(s => parseInt(s.employee_id.replace('EMP', '')));
    const maxId = Math.max(...existingIds, 0);
    return `EMP${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleAdd = () => {
    const newStaff: Staff = {
      id: Date.now(),
      employee_id: formData.employee_id || generateEmployeeId(),
      username: formData.username,
      name: formData.name,
      role: formData.role,
      pin: formData.pin,
      password: formData.password,
      is_active: true,
      created_at: new Date().toISOString()
    };

    setStaff(prev => [...prev, newStaff]);
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      employee_id: staffMember.employee_id,
      username: staffMember.username,
      name: staffMember.name,
      role: staffMember.role,
      pin: staffMember.pin,
      password: staffMember.password
    });
  };

  const handleUpdate = () => {
    if (!editingStaff) return;
    
    setStaff(prev => prev.map(s => 
      s.id === editingStaff.id 
        ? { ...s, ...formData }
        : s
    ));
    
    setEditingStaff(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setStaff(prev => prev.map(s => 
      s.id === id ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      username: '',
      name: '',
      role: 'waiter',
      pin: '',
      password: ''
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800',
      waiter: 'bg-yellow-100 text-yellow-800',
      kitchen_staff: 'bg-purple-100 text-purple-800',
      delivery: 'bg-orange-100 text-orange-800',
      receptionist: 'bg-pink-100 text-pink-800',
      housekeeping: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage employee accounts, roles, and access</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{staff.filter(s => s.is_active).length}</div>
          <div className="text-sm text-gray-600">Active Staff</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{staff.filter(s => !s.is_active).length}</div>
          <div className="text-sm text-gray-600">Inactive Staff</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{staff.filter(s => s.role === 'waiter').length}</div>
          <div className="text-sm text-gray-600">Waiters</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{staff.filter(s => s.role === 'kitchen_staff').length}</div>
          <div className="text-sm text-gray-600">Kitchen Staff</div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credentials</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.employee_id}</div>
                        <div className="text-sm text-gray-500">@{member.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {roles.find(r => r.value === member.role)?.label || member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>PIN: {member.pin}</div>
                      <div className="flex items-center gap-2">
                        <span>Password: </span>
                        <span className="font-mono">
                          {showPasswords[member.id] ? member.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(member.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords[member.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(member.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        member.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
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
      {(showAddModal || editingStaff) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Auto-generated if empty"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 digits)</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.slice(0, 4) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (editingStaff) {
                    setEditingStaff(null);
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
                onClick={editingStaff ? handleUpdate : handleAdd}
                disabled={!formData.name || !formData.username || !formData.pin || !formData.password}
                className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingStaff ? 'Update' : 'Add'} Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
