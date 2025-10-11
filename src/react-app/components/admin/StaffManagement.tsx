import { useState, useEffect } from 'react';
import { User as UserIcon, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import { User } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';

export default function StaffManagement() {
  const [staff, setStaff] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    username: '',
    name: '',
    role: 'waiter',
    pin: '',
    password: '',
    is_active: true
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pos_token');
      const response = await fetch(`${API_URL}/api/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      } else {
        throw new Error('Failed to fetch staff.');
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      setError('Could not load staff data.');
    } finally {
        setIsLoading(false);
    }
  };

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

  const handleAdd = async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchStaff();
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to add staff: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error adding staff member. Check console for details.');
    }
  };

  const handleEdit = (staffMember: User) => {
    setEditingStaff(staffMember);
    setFormData({
      employee_id: staffMember.employee_id,
      username: staffMember.username,
      name: staffMember.name,
      role: staffMember.role,
      pin: staffMember.pin,
      password: '', // Do not pre-fill password for security
      is_active: staffMember.is_active
    });
    setShowAddModal(true);
  };

  const handleUpdate = async () => {
    if (!editingStaff) return;

    try {
      const updateData = formData.password
        ? formData
        : { ...formData, password: undefined };

      const response = await fetch(`${API_URL}/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        fetchStaff();
        setEditingStaff(null);
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to update staff: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error updating staff member. Check console for details.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await fetch(`${API_URL}/api/staff/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('pos_token')}` }
        });

        if (response.ok) {
          fetchStaff();
        } else {
          alert('Failed to delete staff member');
        }
      } catch (error) {
        alert('Error deleting staff member. Check console for details.');
      }
    }
  };

  const toggleActive = async (member: User) => {
    try {
      const response = await fetch(`${API_URL}/api/staff/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_token')}`
        },
        body: JSON.stringify({ is_active: !member.is_active })
      });

      if (response.ok) {
        fetchStaff();
      } else {
        console.error('Failed to toggle active status');
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      username: '',
      name: '',
      role: 'waiter',
      pin: '',
      password: '',
      is_active: true
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">Error: {error}</div>;
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage employee accounts, roles, and access</p>
        </div>
        <button
          onClick={() => { setEditingStaff(null); resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {roles.find(r => r.value === member.role)?.label || member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>PIN: {member.pin}</div>
                    <div>Username: {member.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(member)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        member.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(member)} className="text-blue-600 hover:text-blue-900"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal) && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingStaff && <span className="text-gray-400">(leave blank to keep)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required={!editingStaff}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setEditingStaff(null); resetForm(); }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={editingStaff ? handleUpdate : handleAdd}
                disabled={!formData.name || !formData.username || !formData.pin || (!editingStaff && !formData.password)}
                className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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