import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Package, Bed } from 'lucide-react';
import { formatCurrency } from '@/react-app/data/mockData';

interface ReportData {
  sales: {
    daily: number;
    weekly: number;
    monthly: number;
    yearlyGrowth: number;
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    averageValue: number;
  };
  inventory: {
    lowStock: number;
    totalValue: number;
    topSellingItems: { name: string; quantity: number; revenue: number }[];
  };
  rooms: {
    occupancyRate: number;
    averageRate: number;
    revenue: number;
    totalRooms: number;
  };
  staff: {
    totalActive: number;
    topPerformers: { name: string; orders: number; revenue: number }[];
  };
}

const mockReportData: ReportData = {
  sales: {
    daily: 85420,
    weekly: 567890,
    monthly: 2450000,
    yearlyGrowth: 18.5
  },
  orders: {
    total: 1247,
    completed: 1198,
    cancelled: 49,
    averageValue: 1850
  },
  inventory: {
    lowStock: 5,
    totalValue: 850000,
    topSellingItems: [
      { name: 'Ugali & Nyama Choma', quantity: 156, revenue: 124800 },
      { name: 'Pilau Rice', quantity: 134, revenue: 80400 },
      { name: 'Fish & Chips', quantity: 98, revenue: 73500 },
      { name: 'Chicken Curry', quantity: 87, revenue: 60900 },
      { name: 'Tusker Beer', quantity: 245, revenue: 61250 }
    ]
  },
  rooms: {
    occupancyRate: 78.5,
    averageRate: 7200,
    revenue: 450000,
    totalRooms: 8
  },
  staff: {
    totalActive: 12,
    topPerformers: [
      { name: 'Mary Waiter', orders: 145, revenue: 268300 },
      { name: 'James Cashier', orders: 132, revenue: 244400 },
      { name: 'Peter Delivery', orders: 89, revenue: 164650 },
      { name: 'Rose Receptionist', orders: 76, revenue: 140600 }
    ]
  }
};

export default function ReportsManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: '2024-10-01',
    end: '2024-10-31'
  });

  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'sales', label: 'Sales Report', icon: DollarSign },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'staff', label: 'Staff Performance', icon: Users },
    { id: 'rooms', label: 'Room Revenue', icon: Bed }
  ];

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Mock export functionality
    alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}...`);
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockReportData.sales.monthly)}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-500 text-sm">+{mockReportData.sales.yearlyGrowth}% from last year</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{mockReportData.orders.total}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-blue-500 text-sm">{((mockReportData.orders.completed / mockReportData.orders.total) * 100).toFixed(1)}% completion rate</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bed className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Room Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{mockReportData.rooms.occupancyRate}%</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-purple-500 text-sm">Avg rate: {formatCurrency(mockReportData.rooms.averageRate)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockReportData.inventory.totalValue)}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-orange-500 text-sm">{mockReportData.inventory.lowStock} items low stock</span>
          </div>
        </div>
      </div>

      {/* Top Performing Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {mockReportData.inventory.topSellingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.quantity} sold</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Staff Performance</h3>
          <div className="space-y-3">
            {mockReportData.staff.topPerformers.map((staff, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{staff.name}</div>
                  <div className="text-sm text-gray-600">{staff.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(staff.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Daily Sales</h4>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(mockReportData.sales.daily)}</p>
          <p className="text-sm text-gray-600 mt-2">Today's revenue</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Weekly Sales</h4>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(mockReportData.sales.weekly)}</p>
          <p className="text-sm text-gray-600 mt-2">Last 7 days</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Monthly Sales</h4>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(mockReportData.sales.monthly)}</p>
          <p className="text-sm text-gray-600 mt-2">This month</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Sales Breakdown by Category</h4>
        <div className="space-y-4">
          {[
            { category: 'Main Course', amount: 1200000, percentage: 49 },
            { category: 'Beverages', amount: 600000, percentage: 24.5 },
            { category: 'Room Service', amount: 400000, percentage: 16.3 },
            { category: 'Appetizers', amount: 250000, percentage: 10.2 }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="font-medium text-gray-900">{item.category}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(item.amount)}</div>
                <div className="text-sm text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold">125</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Low Stock Items:</span>
              <span className="font-semibold text-red-600">{mockReportData.inventory.lowStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-semibold text-green-600">{formatCurrency(mockReportData.inventory.totalValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Type</h4>
          <div className="space-y-3">
            {[
              { type: 'Kitchen', items: 45, value: 420000 },
              { type: 'Bar', items: 38, value: 280000 },
              { type: 'Housekeeping', items: 32, value: 120000 },
              { type: 'Minibar', items: 10, value: 30000 }
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-900">{item.type}</span>
                <div className="text-right">
                  <div className="font-semibold">{item.items} items</div>
                  <div className="text-sm text-gray-500">{formatCurrency(item.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaffReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance Overview</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'Mary Waiter', role: 'Waiter', orders: 145, revenue: 268300 },
                { name: 'James Cashier', role: 'Cashier', orders: 132, revenue: 244400 },
                { name: 'Peter Delivery', role: 'Delivery', orders: 89, revenue: 164650 },
                { name: 'Rose Receptionist', role: 'Receptionist', orders: 76, revenue: 140600 },
                { name: 'Sarah Chef', role: 'Kitchen Staff', orders: 0, revenue: 0 }
              ].map((staff, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{staff.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{staff.role}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{staff.orders}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-green-600">{formatCurrency(staff.revenue)}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {staff.orders > 0 ? formatCurrency(staff.revenue / staff.orders) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRoomsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Occupancy Rate</h4>
          <p className="text-3xl font-bold text-blue-600">{mockReportData.rooms.occupancyRate}%</p>
          <p className="text-sm text-gray-600 mt-2">Current month</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Average Rate</h4>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(mockReportData.rooms.averageRate)}</p>
          <p className="text-sm text-gray-600 mt-2">Per night</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Room Revenue</h4>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(mockReportData.rooms.revenue)}</p>
          <p className="text-sm text-gray-600 mt-2">This month</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Room Performance by Type</h4>
        <div className="space-y-4">
          {[
            { type: 'Standard', rooms: 4, occupied: 3, rate: 5000, revenue: 450000 },
            { type: 'Deluxe', rooms: 2, occupied: 1, rate: 7500, revenue: 225000 },
            { type: 'Suite', rooms: 2, occupied: 2, rate: 12000, revenue: 720000 }
          ].map((room, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{room.type} Rooms</div>
                <div className="text-sm text-gray-600">{room.occupied}/{room.rooms} occupied</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(room.revenue)}</div>
                <div className="text-sm text-gray-500">{formatCurrency(room.rate)}/night</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentReport = () => {
    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'staff':
        return renderStaffReport();
      case 'rooms':
        return renderRoomsReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and export comprehensive business reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {reportTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    selectedReport === type.id
                      ? 'text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderCurrentReport()}
        </div>
      </div>
    </div>
  );
}
