import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../config/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ExpensesManagement from '../components/admin/ExpensesManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import SuppliersManagement from '../components/admin/SuppliersManagement';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Package, 
  FileSpreadsheet, 
  AlertTriangle, 
  Receipt, 
  TrendingUp, 
  Clock,
  Download,
  Loader2,
  Calendar,
  Truck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (typeof numAmount !== 'number' || isNaN(numAmount)) return 'KES 0';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
};

export default function AccountantDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end
      }).toString();
      const response = await apiClient.get(`/api/reports/detailed-accounting?${query}`);
      if (!response.ok) throw new Error('Failed to fetch accounting data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchData();
    }
  }, [dateRange, activeTab]);

  const menuItems = [
    { id: 'overview', label: 'Financial Overview', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'reports', label: 'Detailed Reports', icon: FileSpreadsheet },
  ];

  const exportToExcel = () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sales Register Sheet
      const salesRegisterData = data.sales.map((s: any) => ({
        'Date': new Date(s.created_at).toLocaleString(),
        'Receipt #': s.order_number,
        'Branch': s.location || 'Main Location',
        'Customer': s.customer_name || 'Walk-in',
        'Cashier': s.staff_name,
        'Payment Method': s.payment_method,
        'Total Amount': s.total_amount,
        'Status': s.status
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesRegisterData);
      XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Register');

      // 2. Sales Detail Sheet
      const salesDetailData = data.items.map((i: any) => ({
        'Date': new Date(i.created_at).toLocaleString(),
        'Receipt #': i.order_number,
        'Product': i.product_name,
        'Quantity': i.quantity,
        'Unit Price': i.unit_price,
        'Unit Cost': i.buying_price,
        'Total Revenue': i.quantity * i.unit_price,
        'Total Cost': i.quantity * i.buying_price,
        'Profit': i.quantity * (i.unit_price - i.buying_price)
      }));
      const wsDetail = XLSX.utils.json_to_sheet(salesDetailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Sales Detail');

      // 3. Payment Reconciliation Sheet
      const wsPayments = XLSX.utils.json_to_sheet(data.paymentStats);
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment Reconciliation');

      // 4. Expenses Sheet
      const expensesData = data.expenses.map((e: any) => ({
        'Date': new Date(e.date).toLocaleDateString(),
        'Category': e.category,
        'Description': e.description,
        'Amount': e.amount
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

      // 5. Credit Aging Sheet
      const wsCredit = XLSX.utils.json_to_sheet(data.creditAging);
      XLSX.utils.book_append_sheet(wb, wsCredit, 'Credit Aging');

      // 6. Wastage Sheet
      if (data.wastage && data.wastage.length > 0) {
        const wastageData = data.wastage.map((w: any) => ({
          'Date': new Date(w.created_at).toLocaleString(),
          'Reason': w.reason,
          'Quantity': w.quantity,
          'Loss Amount': w.cost
        }));
        const wsWastage = XLSX.utils.json_to_sheet(wastageData);
        XLSX.utils.book_append_sheet(wb, wsWastage, 'Wastage');
      }

      XLSX.writeFile(wb, `Accountant_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'expenses':
        return <ExpensesManagement />;
      case 'suppliers':
        return <SuppliersManagement />;
      case 'reports':
        return <ReportsManagement />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    if (isLoading && !data) {
      return (
        <div className="flex-1 flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading Financial Data...</span>
        </div>
      );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
      <div className="space-y-6">
        {/* 1. Key Financial Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.taxSummary?.totalSales)}</p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Gross Sales</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gross Profit</p>
            <p className="text-xl font-bold text-indigo-600">
              {formatCurrency((data?.taxSummary?.totalSales || 0) - (data?.items?.reduce((sum: number, i: any) => sum + (i.quantity * (i.buying_price || 0)), 0) || 0))}
            </p>
            <p className="mt-2 text-xs text-gray-500">Revenue - COGS</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gross Margin %</p>
            <p className="text-xl font-bold text-blue-600">
              {data?.taxSummary?.totalSales > 0 ? (
                (((data.taxSummary.totalSales - (data?.items?.reduce((sum: number, i: any) => sum + (i.quantity * (i.buying_price || 0)), 0) || 0)) / data.taxSummary.totalSales) * 100).toFixed(1)
              ) : 0}%
            </p>
            <p className="mt-2 text-xs text-gray-500">Profitability ratio</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Transaction</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(data?.taxSummary?.totalSales / (data?.sales?.length || 1))}
            </p>
            <p className="mt-2 text-xs text-gray-500">Per order average</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(data?.taxSummary?.totalExpenses)}</p>
            <p className="mt-2 text-xs text-gray-500">Operational costs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Method Split */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Payment Method Split
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.paymentStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.paymentStats?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tax & VAT Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-500" />
              Expense & Tax Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">VAT Collected (Sales)</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.taxSummary?.vatCollected)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">VAT Paid (Expenses)</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.taxSummary?.vatPaid)}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-700 font-semibold mb-1">Net VAT Obligation</p>
                <p className="text-xl font-bold text-indigo-900">{formatCurrency(data?.taxSummary?.netVat)}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div>
                  <p className="text-sm text-green-700 font-semibold">Net Profit Calculation</p>
                  <p className="text-xs text-green-600">Revenue - COGS - Expenses</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency((data?.taxSummary?.totalSales || 0) - (data?.items?.reduce((sum: number, i: any) => sum + (i.quantity * (i.buying_price || 0)), 0) || 0) - (data?.taxSummary?.totalExpenses || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Transaction Oversight (Sales Register) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Transaction Oversight (Sales Register)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Date/Time</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Receipt #</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Branch/Location</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Cashier</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Payment Method</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.sales?.slice(0, 10).map((sale: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{sale.order_number}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.location || 'Main Branch'}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.staff_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                        sale.payment_method === 'mpesa' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {sale.payment_method?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(sale.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Inventory & Profit Audit (Sales Detail) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Top 5 Selling Products (Profit Audit)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Product</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-600">Qty</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-600">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.items?.slice(0, 5).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.product_name}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        {formatCurrency(item.quantity * (item.unit_price - item.buying_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            {/* 5. Credit & Debt Tracking (Credit Aging) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Credit & Debt (Aging Analysis)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-600">Customer</th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-600">Balance</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-600">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.creditAging?.slice(0, 5).map((credit: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{credit.customer}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(credit.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            credit.daysOutstanding > 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {credit.daysOutstanding}d
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dead Stock Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Dead Stock Analysis (Not sold in 90 days)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-600">Product</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-600">Type</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-600">In Stock</th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-600">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.deadStock?.slice(0, 5).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-gray-600 capitalize">{item.inventory_type}</td>
                        <td className="px-6 py-4 text-center text-gray-600">{item.current_stock}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.current_stock * item.cost_per_unit)}</td>
                      </tr>
                    ))}
                    {(!data?.deadStock || data.deadStock.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No dead stock found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar 
          title="Accountant Panel"
          navItems={menuItems}
          activeItem={activeTab}
          onNavItemClick={setActiveTab}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {menuItems.find(i => i.id === activeTab)?.label || 'Accountant Dashboard'}
                </h1>
                <p className="text-gray-600 text-sm">Comprehensive financial oversight and auditing</p>
              </div>
              {activeTab === 'overview' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                      className="text-sm border-none focus:ring-0 p-0"
                    />
                    <span className="text-gray-400">to</span>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                      className="text-sm border-none focus:ring-0 p-0"
                    />
                  </div>
                  <button 
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>One-Click Export</span>
                  </button>
                </div>
              )}
            </div>

            {error && activeTab === 'overview' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            {renderContent()}

          </div>
        </main>
      </div>
    </div>
  );
}
