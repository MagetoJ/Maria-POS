import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Package, Bed, Loader2, AlertTriangle, Printer, ChevronDown, BarChart3, Clock, CreditCard, Trash2, FileSpreadsheet } from 'lucide-react';
import { apiClient, fetchReceiptsByDate } from '../../config/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ReceiptModal from '../receptionist/ReceiptModal';
import InvoiceModal from './InvoiceModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, ScatterChart, Scatter, ZAxis } from 'recharts';

type OrderType = any;

// Format currency function (assuming KES)
const formatCurrency = (amount: any): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) {
    return 'KES 0';
  }
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Format order type for display
const formatOrderType = (orderType?: string): string => {
  switch (orderType) {
    case 'dine_in':
      return 'Dine-In';
    case 'takeaway':
      return 'Takeaway';
    case 'delivery':
      return 'Delivery';
    case 'room_service':
      return 'Room Service';
    default:
      return 'General';
  }
};

// --- Interfaces for different report data structures ---
interface OverviewReportData {
  sales: { 
    monthly: number;
    total_revenue: number;
    total_cogs: number;
    total_expenses: number;
    gross_profit: number;
    net_profit: number;
    revenue_trend: { date: string; revenue: number }[];
  };
  orders: { total: number; completed: number; averageValue: number };
  inventory: { topSellingItems: { name: string; quantity: number; revenue: number }[] };
  staff: { topPerformers: { name: string; orders: number; revenue: number }[] };
}

interface SalesReportData {
  salesByDay: { date: string; total: number }[];
}

interface InventoryReportData {
    lowStockItems: { id: number; name: string; current_stock: number; minimum_stock: number }[];
    allItems?: {
      id: number;
      name: string;
      inventory_type: string;
      current_stock: number;
      minimum_stock: number;
      unit: string;
      cost_per_unit: number;
      total_value: number;
      supplier_name?: string;
    }[];
    summary?: { inventory_type: string; item_count: number; total_value: number }[];
    totalValue: number;
}

interface StaffReportData {
    name: string;
    role: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
}

interface RoomReportData {
    roomRevenue: number;
    roomStatusCounts: { status: string; count: number }[];
}

interface AnnualReportData {
  year: number;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    bestMonth: { name: string; revenue: number; orders: number };
    worstMonth: { name: string; revenue: number; orders: number };
  };
  monthlyBreakdown: {
    month: string;
    monthNum: number;
    revenue: number;
    orders: number;
  }[];
}

interface HourlyData {
  hour: string;
  revenue: number;
  orders: number;
}

interface PaymentData {
  name: string;
  value: number;
  count: number;
}

interface MenuData {
  name: string;
  popularity: number;
  revenue: number;
}

interface WastageData {
  reason: string;
  count: number;
  loss: number;
}

interface PriceVarianceData {
  order_number: string;
  created_at: string;
  product_name: string;
  standard_price: number;
  actual_price: number;
  quantity: number;
  variance_amount: number;
  staff_name: string;
}

interface DeadStockData {
  id: number;
  name: string;
  inventory_type: string;
  current_stock: number;
  cost_per_unit: number;
  last_update: string;
}

export default function ReportsManagement() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Default to false initially
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState(user?.role === 'accountant' ? 'detailed-accounting' : 'overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Default to start of month
    end: new Date().toISOString().split('T')[0] // Default to today
  });

  // --- ADDED: New state for Receipt Auditing ---
  const [receiptStartDate, setReceiptStartDate] = useState('');
  const [receiptEndDate, setReceiptEndDate] = useState('');
  const [receiptCustomerName, setReceiptCustomerName] = useState('');
  const [receiptOrderType, setReceiptOrderType] = useState('');
  // --- CORRECTED: Use the defined OrderType (which is 'any' for now) ---
  const [receipts, setReceipts] = useState<OrderType[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  // --- CORRECTED: Use the defined OrderType ---
  const [selectedReceipt, setSelectedReceipt] = useState<OrderType | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  // Optional: Add pagination state if needed
  // const [receiptPage, setReceiptPage] = useState(0);
  // const [receiptTotal, setReceiptTotal] = useState(0);

  // --- ADDED: Responsive navigation state ---
  const [showDropdown, setShowDropdown] = useState(false);

  // --- ADDED: Annual Report state ---
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  // --- ADDED: Overview Analytics Data ---
  const [hourlyData, setHourlyData] = useState<HourlyData[] | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData[] | null>(null);
  const [menuData, setMenuData] = useState<MenuData[] | null>(null);
  const [wastageData, setWastageData] = useState<WastageData[] | null>(null);

  useEffect(() => {
    if (selectedReport === 'receiptAudit') {
      setIsLoading(false);
      setError(null);
      setReportData(null);
    } else if (selectedReport === 'annual') {
      fetchAnnualReport();
    } else {
      fetchReportData();
    }
  }, [selectedReport, dateRange.start, dateRange.end, selectedYear]);

  const fetchReportData = async () => {
    if (selectedReport === 'receiptAudit') {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);

    const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
    }).toString();

    try {
      const endpoint = `/api/reports/${selectedReport}?${query}`;
      console.log('Fetching report from:', endpoint);
      
      const response = await apiClient.get(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes('forbidden') || response.status === 403) {
             throw new Error(`Access Denied (403): You might not have the required permissions for this report.`);
         } else if (response.status === 401) {
             throw new Error(`Authentication Required (401): Please log in again.`);
         }
        throw new Error(`Failed to fetch report data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Report data received:', selectedReport, data);
      setReportData(data);

      // If overview, also fetch the 4 analytics endpoints
      if (selectedReport === 'overview') {
        try {
          const [hourly, payments, menu, wastage] = await Promise.all([
            apiClient.get(`/api/reports/hourly?${query}`),
            apiClient.get(`/api/reports/payments?${query}`),
            apiClient.get(`/api/reports/menu-analysis?${query}`),
            apiClient.get(`/api/reports/wastage?${query}`)
          ]);

          const hourlyJson = await hourly.json();
          const paymentsJson = await payments.json();
          const menuJson = await menu.json();
          const wastageJson = await wastage.json();

          setHourlyData(hourlyJson);
          setPaymentData(paymentsJson);
          setMenuData(menuJson);
          setWastageData(wastageJson);
        } catch (analyticsErr) {
          console.warn('Failed to fetch analytics data:', analyticsErr);
        }
      }
    } catch (err) {
       let specificError = 'Failed to fetch report data. Please check the console.';
       if (err instanceof Error) {
           specificError = err.message;
       }
      setError(specificError);
      console.error("Failed to fetch report data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnnualReport = async () => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const endpoint = `/api/reports/annual?year=${selectedYear}`;
      console.log('Fetching annual report from:', endpoint);
      
      const response = await apiClient.get(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes('forbidden') || response.status === 403) {
          throw new Error(`Access Denied (403): You might not have the required permissions for this report.`);
        } else if (response.status === 401) {
          throw new Error(`Authentication Required (401): Please log in again.`);
        }
        throw new Error(`Failed to fetch annual report: ${response.status}`);
      }

      try {
        const responseData = await response.json();
        console.log('Annual report raw response:', responseData);
        const data = responseData.data || responseData;
        console.log('Annual report data after unwrap:', data);
        setReportData(data);
      } catch (jsonError) {
        console.error("JSON Parsing Error:", jsonError);
        throw new Error('Failed to parse server response.');
      }
    } catch (err) {
      let specificError = 'Failed to fetch annual report. Please check the console.';
      if (err instanceof Error) {
        specificError = err.message;
      }
      setError(specificError);
      console.error("Failed to fetch annual report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADDED: New handler for fetching receipts ---
  const handleSearchReceipts = async () => {
    if (!receiptStartDate || !receiptEndDate) {
      setReceiptError('Please select both a start and end date/time.');
      return;
    }
    setReceiptLoading(true);
    setReceiptError(null);
    setReceipts([]); // Clear previous results
    try {
      // Fetch receipts using the specific function (already includes /api prefix)
      // fetchReceiptsByDate already handles JSON parsing and throws on error
      const data = await fetchReceiptsByDate(
        receiptStartDate, 
        receiptEndDate, 
        100, 
        0,
        receiptOrderType || undefined,
        receiptCustomerName || undefined
      ); // Limit 100, offset 0 for now
      setReceipts(data.orders);
      // setReceiptTotal(data.pagination.total); // Uncomment if pagination needed
    } catch (error) {
       // --- IMPROVED ERROR HANDLING ---
       console.error('Failed to fetch receipts:', error); // Log the actual error object
       let specificError = 'Failed to fetch receipts. Please check the console.';
       // Check for specific error messages passed from fetchReceiptsByDate or apiClient
        if (error instanceof Error) {
            if (error.message.includes('JSON') || error.message.includes('HTML')) {
                 specificError = 'Received an invalid response (HTML instead of JSON). Check server logs and authentication.';
                 console.error(">>>>> HINT: The server sent HTML instead of JSON. Check Network tab response and server logs for errors. <<<<<");
            } else if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('Denied')) {
               specificError = 'Access Denied (403): Ensure you are logged in as an Admin.';
           } else if (error.message.includes('401')) {
                specificError = 'Authentication Error (401): Please log in again.';
           } else {
               specificError = error.message; // Use the message from the thrown error
           }
       }
       setReceiptError(specificError);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleGenerateInvoice = async (orderId: number) => {
    try {
      const response = await apiClient.post('/api/invoices', {
        order_id: orderId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedInvoiceId(data.id);
      } else {
        if (data.invoice) {
          setSelectedInvoiceId(data.invoice.id);
        } else {
          alert(data.message || 'Failed to generate invoice');
        }
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      alert('Error generating invoice');
    }
  };


  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'detailed-accounting', label: 'Financial Dashboard', icon: FileSpreadsheet, roles: ['admin', 'accountant'] },
    { id: 'sales', label: 'Sales Report', icon: DollarSign },
    { id: 'annual', label: 'Annual Report', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'staff', label: 'Staff Performance', icon: Users },
    { id: 'rooms', label: 'Room Revenue', icon: Bed },
    { id: 'price-variance', label: 'Price Variance', icon: AlertTriangle },
    { id: 'dead-stock', label: 'Dead Stock', icon: Clock },
    { id: 'receiptAudit', label: 'Receipt Audit', icon: Printer }
  ].filter(type => !type.roles || (user && type.roles.includes(user.role)));

  const exportToExcel = (data: any, reportName: string) => {
    let sheetData: any[] = [];
    let fileName = `${reportName}_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (selectedReport === 'inventory') {
      const inventoryData = (data as InventoryReportData).allItems || [];

      sheetData = inventoryData.map(item => ({
        'Item Name': item.name,
        'Type': item.inventory_type.toUpperCase(),
        'Current Stock': item.current_stock,
        'Unit': item.unit,
        'Cost Per Unit (KES)': item.cost_per_unit,
        'Total Value (KES)': item.total_value,
        'Supplier': item.supplier_name || 'N/A',
        'Status': item.current_stock <= item.minimum_stock ? 'LOW STOCK' : 'OK'
      }));

    } else if (selectedReport === 'sales') {
      sheetData = (data.salesByDay || []).map((item: any) => ({
        'Date': new Date(item.date).toLocaleDateString(),
        'Total Sales (KES)': item.total
      }));

    } else if (selectedReport === 'staff') {
      sheetData = (data || []).map((item: any) => ({
        'Staff Name': item.name,
        'Role': item.role,
        'Total Orders': item.orders,
        'Revenue Generated (KES)': item.revenue,
        'Avg Order Value (KES)': item.avgOrderValue
      }));

    } else if (selectedReport === 'overview') {
      sheetData = [
        { Metric: 'Total Revenue', Value: data.sales?.monthly },
        { Metric: 'Total Orders', Value: data.orders?.total },
        { Metric: 'Avg Order Value', Value: data.orders?.averageValue },
      ];

    } else if (selectedReport === 'rooms') {
      sheetData = (data.roomStatusCounts || []).map((item: any) => ({
        'Room Status': item.status,
        'Count': item.count
      }));

    } else if (selectedReport === 'price-variance') {
      sheetData = (data || []).map((item: any) => ({
        'Order Number': item.order_number,
        'Date': new Date(item.created_at).toLocaleString(),
        'Product': item.product_name,
        'Std Price': item.standard_price,
        'Actual Price': item.actual_price,
        'Quantity': item.quantity,
        'Variance': item.variance_amount,
        'Staff': item.staff_name
      }));

    } else if (selectedReport === 'dead-stock') {
      sheetData = (data || []).map((item: any) => ({
        'Item Name': item.name,
        'Type': item.inventory_type,
        'Stock': item.current_stock,
        'Unit Cost': item.cost_per_unit,
        'Total Value': item.current_stock * item.cost_per_unit,
        'Last Update': new Date(item.last_update || '').toLocaleDateString()
      }));

    } else if (selectedReport === 'annual') {
      const annualData = data as AnnualReportData;
      fileName = `annual_report_${annualData.year}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      sheetData = annualData.monthlyBreakdown.map((month: any) => ({
        'Month': month.month,
        'Revenue (KES)': month.revenue,
        'Orders': month.orders,
        'Avg Order Value (KES)': month.revenue / (month.orders || 1)
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);

    const wscols = Object.keys(sheetData[0] || {}).map(k => ({ wch: 20 }));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Report Data");
    XLSX.writeFile(wb, fileName);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      if (!reportData) {
        alert('No data to export. Please generate a report first.');
        return;
      }

      if (format === 'pdf') {
        const reportElement = document.getElementById('report-content');
        if (!reportElement) {
          alert('Report content not found');
          return;
        }
        const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, allowTaint: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // Use A4 page size
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add padding/margins if needed
        const marginLeft = 10;
        const marginTop = 10;
        const effectiveWidth = imgWidth - (marginLeft * 2);
        const effectiveHeight = (canvas.height * effectiveWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', marginLeft, marginTop, effectiveWidth, effectiveHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - effectiveHeight; // Correct position calculation
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', marginLeft, marginTop - (imgHeight - heightLeft), effectiveWidth, effectiveHeight); // Adjust y position
          heightLeft -= pageHeight;
        }
        const fileName = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        alert('PDF export successful!');

      } else if (format === 'excel') {
        exportToExcel(reportData, selectedReport);
        alert('Excel export successful!');

      } else {
        alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}... (Not yet implemented)`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  const exportDetailedAccountingReport = async () => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      }).toString();

      const response = await apiClient.get(`/api/reports/detailed-accounting?${query}`);
      if (!response.ok) throw new Error('Failed to fetch detailed accounting data');
      
      const data = await response.json();
      const workbook = XLSX.utils.book_new();

      // 1. Sales Register Sheet
      const salesData = data.sales || [];
      const registerData = salesData.map((sale: any) => ({
        "Date": new Date(sale.created_at).toLocaleDateString(),
        "Receipt #": sale.order_number,
        "Branch": sale.location || 'Main Location',
        "Customer": sale.customer_name || 'Walk-in',
        "Cashier": sale.staff_name || 'System',
        "Payment Method": sale.payment_method || 'Cash',
        "Total": sale.total_amount,
        "Status": sale.status
      }));
      const registerSheet = XLSX.utils.json_to_sheet(registerData);
      XLSX.utils.book_append_sheet(workbook, registerSheet, "Sales Register");

      // 2. Sales Detail Sheet
      const itemsData = data.items || [];
      const detailData = itemsData.map((item: any) => ({
        "Date": new Date(item.created_at).toLocaleDateString(),
        "Receipt #": item.order_number,
        "Product Code": item.sku,
        "Product Name": item.product_name,
        "Quantity": item.quantity,
        "Unit Price": item.unit_price,
        "Cost": item.buying_price || 0,
        "Profit": (item.unit_price - (item.buying_price || 0)) * item.quantity
      }));
      const detailSheet = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, "Sales Detail");

      // 3. Payment Reconciliation Sheet
      const statsData = data.paymentStats || [];
      const reconData = statsData.map((stat: any) => ({
        "Payment Method": stat.name,
        "Transaction Count": stat.count,
        "Total Amount": stat.value
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reconData), "Payment Reconciliation");

      // 4. Expense Register Sheet
      const expensesData = data.expenses || [];
      const expData = expensesData.map((exp: any) => ({
        "Date": new Date(exp.date).toLocaleDateString(),
        "Category": exp.category,
        "Description": exp.description,
        "Amount": exp.amount
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expData), "Expense Register");

      // 5. Wastage Sheet
      const wastageData = data.wastage || [];
      const wasteData = wastageData.map((w: any) => ({
        "Date": new Date(w.created_at).toLocaleDateString(),
        "Reason": w.reason,
        "Quantity Wasted": w.quantity_wasted,
        "Loss Value": w.cost || 0
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(wasteData), "Wastage Report");

      // 6. VAT Summary Sheet
      const summary = data.taxSummary || {};
      const vatData = [
        { "Metric": "Total Sales (VAT Incl.)", "Value": summary.totalSales || 0 },
        { "Metric": "VAT Collected on Sales (16%)", "Value": summary.vatCollected || 0 },
        { "Metric": "Total Expenses (VAT Incl.)", "Value": summary.totalExpenses || 0 },
        { "Metric": "VAT Paid on Purchases (16%)", "Value": summary.vatPaid || 0 },
        { "Metric": "Net VAT Obligation", "Value": summary.netVat || 0 }
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(vatData), "VAT Summary");

      // Generate and Download
      const fileName = `Accounting_Export_${dateRange.start}_to_${dateRange.end}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      alert('Detailed accounting export successful!');
    } catch (error) {
      console.error('Detailed accounting export error:', error);
      alert('Failed to generate detailed accounting report');
    } finally {
      setIsExporting(false);
    }
  };
  
  // --- Rendering functions for standard reports (renderOverviewReport, etc.) ---
  // --- Assume these exist as in your provided code ---
  const renderOverviewReport = () => {
    const data = reportData as OverviewReportData;
    if (!data || !data.sales) {
        return <div className="text-center py-8">No summary data available for the selected period.</div>;
    }

    const { 
        total_revenue = 0, 
        total_cogs = 0, 
        total_expenses = 0, 
        gross_profit = 0, 
        net_profit = 0, 
        revenue_trend = [] 
    } = data.sales;

    return (
        <div className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(total_revenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(gross_profit)}</p>
                            <p className="text-xs text-gray-500">Margin: {total_revenue > 0 ? ((gross_profit / total_revenue) * 100).toFixed(1) : 0}%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg"><Trash2 className="w-5 h-5 text-red-600" /></div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(total_expenses)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(net_profit)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            {revenue_trend && revenue_trend.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
                  <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenue_trend}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="date" tick={{fontSize: 12}} />
                              <YAxis tick={{fontSize: 12}} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                     <div className="space-y-3">
                         {(data.inventory?.topSellingItems || []).map((item, index) => (
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
                          {(!data.inventory?.topSellingItems || data.inventory.topSellingItems.length === 0) && (
                              <div className="text-center py-4 text-gray-500">No sales data available</div>
                          )}
                     </div>
                 </div>
                 <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Staff Performance</h3>
                     <div className="space-y-3">
                         {(data.staff?.topPerformers || []).map((staff, index) => (
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
                         {(!data.staff?.topPerformers || data.staff.topPerformers.length === 0) && (
                             <div className="text-center py-4 text-gray-500">No staff performance data available</div>
                         )}
                     </div>
                 </div>
             </div>

            {hourlyData && <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Peak Hours Analysis</h3>
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue (KES)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>}

            {paymentData && <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Method Breakdown</h3>
              <div style={{ height: '350px', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={paymentData} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false} 
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100} 
                      fill="#8884d8" 
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => {
                        const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>}

            {menuData && menuData.length > 0 && <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Engineering Matrix</h3>
              <p className="text-sm text-gray-500 mb-6">Popularity vs Profitability (Green=Stars, Yellow=Plowhorses, Blue=Puzzles, Red=Dogs)</p>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="popularity" name="Quantity Sold" />
                    <YAxis type="number" dataKey="revenue" name="Total Revenue" />
                    <ZAxis type="category" dataKey="name" name="Item" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Menu Items" data={menuData} fill="#8884d8">
                      {menuData.map((entry, index) => {
                        const avgPop = menuData.reduce((sum, i) => sum + i.popularity, 0) / menuData.length;
                        const avgRev = menuData.reduce((sum, i) => sum + i.revenue, 0) / menuData.length;
                        const isHighPop = entry.popularity >= avgPop;
                        const isHighRev = entry.revenue >= avgRev;
                        let color = '#8884d8';
                        if (isHighPop && isHighRev) color = '#16a34a';
                        else if (isHighPop && !isHighRev) color = '#eab308';
                        else if (!isHighPop && isHighRev) color = '#2563eb';
                        else color = '#dc2626';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>}

            {wastageData && wastageData.length > 0 && <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Wastage Analysis</h3>
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wastageData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="reason" type="category" width={100} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="loss" name="Total Loss (KES)" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>}
        </div>
    );
  };
  const renderSalesReport = () => { /* ... existing code ... */ 
    if (!reportData || !reportData.salesByDay) return <div className="text-center py-10 text-gray-500">No sales data available for the selected period.</div>;
    const data = reportData as SalesReportData;
    if (data.salesByDay.length === 0) return <div className="text-center py-10 text-gray-500">No sales in this date range</div>;
    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales</h3>
              <div className="overflow-x-auto">
                 <table className="w-full">
                     <thead className="bg-gray-50">
                         <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                         </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                         {data.salesByDay.map((sale, idx) => (
                             <tr key={idx}>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.total)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
  };
  const renderInventoryReport = () => { /* ... existing code ... */
    if (!reportData) return <div className="text-center py-10 text-gray-500">No inventory data available for the selected period.</div>;
    const data = reportData as InventoryReportData;
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Items</h3>
                 {data.lowStockItems && data.lowStockItems.length > 0 ? (
                      <div className="overflow-x-auto">
                         <table className="w-full">
                             <thead className="bg-gray-50">
                                 <tr>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum Stock</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                 {data.lowStockItems.map(item => (
                                     <tr key={item.id}>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.name}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.current_stock}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.minimum_stock}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 ) : (
                     <p className="text-gray-500 text-center py-4">All items are well stocked! ✓</p>
                 )}
            </div>
            {/* Total Inventory Value */}
             <div className="bg-white rounded-lg p-4 border border-gray-200">
                 <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalValue || 0)}</div>
                 <div className="text-sm text-gray-600">Total Inventory Value</div>
             </div>
        </div>
    );
   };
  const renderStaffReport = () => { /* ... existing code ... */
    if (!reportData || !Array.isArray(reportData)) return <div className="text-center py-10 text-gray-500">No staff data available for the selected period.</div>;
    const data = reportData as StaffReportData[];
    if (data.length === 0) return <div className="text-center py-10 text-gray-500">No staff activity in this date range</div>;
    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
             <div className="overflow-x-auto">
                 <table className="w-full">
                     <thead className="bg-gray-50">
                         <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Taken</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Order Value</th>
                         </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                         {data.map((staff, idx) => (
                             <tr key={idx}>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.name}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.role}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.orders}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(staff.revenue)}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(staff.avgOrderValue)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
  };
  const renderRoomReport = () => { /* ... existing code ... */ 
    if (!reportData) return <div className="text-center py-10 text-gray-500">No room data available for the selected period.</div>;
    const data = reportData as RoomReportData;
    return (
         <div className="space-y-6">
             <div className="bg-white rounded-lg p-6 border border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Revenue</h3>
                 <div className="text-3xl font-bold text-green-600">{formatCurrency(data.roomRevenue || 0)}</div>
             </div>
             <div className="bg-white rounded-lg p-6 border border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Status</h3>
                 {data.roomStatusCounts && data.roomStatusCounts.length > 0 ? (
                      <div className="overflow-x-auto">
                         <table className="w-full">
                             <thead className="bg-gray-50">
                                 <tr>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Rooms</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                 {data.roomStatusCounts.map((status, idx) => (
                                     <tr key={idx}>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{status.status}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{status.count}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 ) : (
                     <p className="text-gray-500 text-center py-4">No rooms configured</p>
                 )}
             </div>
         </div>
    );
  };
  // --- Annual Report Rendering ---
  const renderAnnualReport = () => {
    if (!reportData) return <div className="text-center py-10 text-gray-500">No data available for the selected year.</div>;
    
    try {
      const data = reportData as AnnualReportData;
      if (!data.monthlyBreakdown || !data.summary) {
        return <div className="text-center py-10 text-gray-500">Invalid annual report data.</div>;
      }
      const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    
    return (
      <div id="report-content" className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-2">{data.year}</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600">{data.summary.totalOrders.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Completed orders</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600 mb-2">Best Month</p>
            <p className="text-lg font-bold text-purple-600">{data.summary.bestMonth.name}</p>
            <p className="text-sm text-gray-500 mt-2">{formatCurrency(data.summary.bestMonth.revenue)}</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600 mb-2">Worst Month</p>
            <p className="text-lg font-bold text-orange-600">{data.summary.worstMonth.name}</p>
            <p className="text-sm text-gray-500 mt-2">{formatCurrency(data.summary.worstMonth.revenue)}</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue (KES)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Orders Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} name="Number of Orders" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Monthly Data Table */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.monthlyBreakdown.map((month) => (
                  <tr key={month.monthNum} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{month.month}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{formatCurrency(month.revenue)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{month.orders}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(month.revenue / (month.orders || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
    } catch (err) {
      console.error('Error rendering annual report:', err);
      return <div className="text-center py-10 text-red-500">Error loading annual report data.</div>;
    }
  };
  // --- END of standard report rendering functions ---

  const renderHourlyReport = () => {
    const data = reportData as HourlyData[];
    if (!data || data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No hourly data available.</div>;
    }
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales by Hour of Day</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue (KES)" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPaymentReport = () => {
    const data = reportData as PaymentData[];
    if (!data || data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No payment data available.</div>;
    }
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Method Breakdown</h3>
        <div style={{ height: '400px', display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120} 
                fill="#8884d8" 
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMenuMatrix = () => {
    const data = reportData as MenuData[];
    if (!data || data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No menu data available.</div>;
    }
    const avgPop = data.reduce((sum, i) => sum + i.popularity, 0) / (data.length || 1);
    const avgRev = data.reduce((sum, i) => sum + i.revenue, 0) / (data.length || 1);

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Engineering Matrix</h3>
        <p className="text-sm text-gray-500 mb-6">Popularity (Quantity) vs Profitability (Revenue)</p>
        <div style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="popularity" name="Quantity Sold" />
              <YAxis type="number" dataKey="revenue" name="Total Revenue" />
              <ZAxis type="category" dataKey="name" name="Item" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Menu Items" data={data} fill="#8884d8">
                {data.map((entry, index) => {
                  const isHighPop = entry.popularity >= avgPop;
                  const isHighRev = entry.revenue >= avgRev;
                  let color = '#8884d8';
                  if (isHighPop && isHighRev) color = '#16a34a';
                  else if (isHighPop && !isHighRev) color = '#eab308';
                  else if (!isHighPop && isHighRev) color = '#2563eb';
                  else color = '#dc2626';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderWastageReport = () => {
    const data = reportData as WastageData[];
    if (!data || data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No wastage data recorded.</div>;
    }
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Wastage Analysis</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="reason" type="category" width={100} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="loss" name="Total Loss (KES)" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDeadStockReport = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No dead stock identified.</div>;
    }

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Dead Stock Report (No sales in 90 days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => {
                if (!item) return null;
                const qty = Number(item.current_stock) || 0;
                const cost = Number(item.cost_per_unit) || 0;
                
                return (
                  <tr key={item.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name || 'Unnamed Item'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.inventory_type || 'n/a'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(qty * cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPriceVarianceReport = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    
    if (data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No price variances found for this period.</div>;
    }

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Price Variance Report (Unauthorized Discounts)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Std Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, idx) => {
                if (!item) return null;
                return (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.order_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_name || 'Unknown Product'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.standard_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatCurrency(item.actual_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-700">{formatCurrency(item.variance_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.staff_name || 'System'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDetailedAccountingReport = () => {
    const data = reportData;
    if (!data) return null;

    const { 
      sales: rawSales = [], 
      items: rawItems = [], 
      paymentStats: rawPaymentStats = [], 
      taxSummary = {}, 
      creditAging: rawCreditAging = [],
      wastage: rawWastage = []
    } = data;

    const sales = Array.isArray(rawSales) ? rawSales : [];
    const items = Array.isArray(rawItems) ? rawItems : [];
    const paymentStats = Array.isArray(rawPaymentStats) ? rawPaymentStats : [];
    const creditAging = Array.isArray(rawCreditAging) ? rawCreditAging : [];
    const wastage = Array.isArray(rawWastage) ? rawWastage : [];

    return (
      <div className="space-y-8">
        {/* 1. Key Financial Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(taxSummary?.totalSales || 0)}</p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Margin %</p>
            <p className="text-2xl font-bold text-blue-600">
              {taxSummary?.totalSales > 0 ? ((( (Number(taxSummary.totalSales) || 0) - (Number(taxSummary.totalExpenses) || 0) ) / (Number(taxSummary.totalSales) || 1)) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency((Number(taxSummary?.totalSales) || 0) - (Number(taxSummary?.totalExpenses) || 0))}</p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(taxSummary?.totalExpenses || 0)}</p>
          </div>
        </div>

        {/* 2. Tax Summary */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            VAT & Tax Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">VAT Collected (Sales)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(taxSummary?.vatCollected)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">VAT Paid (Purchases/Expenses)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(taxSummary?.vatPaid)}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-700 font-medium">Net VAT Obligation</p>
              <p className="text-xl font-bold text-indigo-900">{formatCurrency(taxSummary?.netVat)}</p>
            </div>
          </div>
        </div>

        {/* 3. Transaction Oversight (Sales Register) */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Transaction Oversight (Sales Register)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.slice(0, 10).map((sale: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(sale.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{sale.order_number}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{sale.staff_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{sale.payment_method}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Credit & Debt Tracking */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Credit & Debt Tracking (Aging Analysis)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days Outstanding</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {creditAging.length > 0 ? creditAging.map((credit: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{credit.customer}</td>
                    <td className="px-4 py-2 text-sm font-bold text-red-600">{formatCurrency(credit.amount)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(credit.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{credit.daysOutstanding} days</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        credit.daysOutstanding > 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {credit.daysOutstanding > 30 ? 'Overdue' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No outstanding credit found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Inventory & Profit Audit (Sales Detail) */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Inventory & Profit Audit (Sales Detail)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.slice(0, 10).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.product_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{formatCurrency(item.buying_price)}</td>
                    <td className="px-4 py-2 text-sm font-bold text-green-600">
                      {formatCurrency((item.unit_price - item.buying_price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Wastage Audit */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Wastage Audit
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loss Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {wastage.length > 0 ? wastage.slice(0, 10).map((w: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{w.reason}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{w.quantity_wasted}</td>
                    <td className="px-4 py-2 text-sm font-bold text-red-600">{formatCurrency(w.cost)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No wastage records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentReport = () => {
    if (isLoading && selectedReport !== 'receiptAudit') { // Show loading only for standard reports here
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="ml-4 text-gray-600">Generating report...</p>
        </div>
      );
    }

    if (error && selectedReport !== 'receiptAudit') { // Show error only for standard reports here
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="mt-4 font-semibold text-red-700">Failed to load report data</p>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (!reportData && selectedReport !== 'receiptAudit') {
      if (selectedReport === 'annual') {
        return <div className="text-center py-20 text-gray-500">Select a year to generate a report.</div>;
      }
      return <div className="text-center py-20 text-gray-500">Select a date range to generate a report.</div>;
    }

    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'annual':
        return renderAnnualReport();
      case 'inventory':
        return renderInventoryReport();
      case 'staff':
        return renderStaffReport();
      case 'rooms':
        return renderRoomReport();
      case 'price-variance':
        return renderPriceVarianceReport();
      case 'dead-stock':
        return renderDeadStockReport();
      case 'detailed-accounting':
        return renderDetailedAccountingReport();
      case 'receiptAudit':
        return null;
      default: // Overview
        return renderOverviewReport();
    }
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReport(reportId);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and export comprehensive business reports</p>
        </div>
        {/* Only show export buttons for standard reports */}
        {selectedReport !== 'receiptAudit' && reportData && ( // Only show if data exists
          <div className="flex flex-wrap gap-2">
                {(user?.role === 'admin' || user?.role === 'accountant') && (
                  <button
                    onClick={exportDetailedAccountingReport}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                    Accountant Export
                  </button>
                )}
                <button
                  onClick={() => handleExport('excel')}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
          </div>
        )}
      </div>

      {/* Year Picker for Annual Reports */}
      {selectedReport === 'annual' && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Select Year:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedYear(prev => prev - 1)}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 font-medium text-sm"
                >
                  ←
                </button>
                <input
                  type="number"
                  min={2000}
                  max={currentYear + 10}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentYear)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium w-24 text-center"
                />
                <button
                  onClick={() => setSelectedYear(prev => prev + 1)}
                  disabled={selectedYear >= currentYear + 10}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 font-medium text-sm disabled:opacity-50"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Report Date Range Picker (Only shown for non-annual, non-audit reports) */}
      {selectedReport !== 'receiptAudit' && selectedReport !== 'annual' && (
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
                  min={dateRange.start}
                />
              </div>
            </div>
        </div>
      )}


      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          {/* Desktop Navigation - Tabs */}
          <nav className="hidden md:flex overflow-x-auto">
            {reportTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => handleSelectReport(type.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm font-medium whitespace-nowrap ${
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

          {/* Mobile Navigation - Dropdown */}
          <div className="md:hidden p-3">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <span className="flex items-center gap-2">
                {(() => {
                  const selectedType = reportTypes.find(t => t.id === selectedReport);
                  return (
                    <>
                      {selectedType?.icon && React.createElement(selectedType.icon, { className: "w-4 h-4" })}
                      {selectedType?.label || 'Select Report'}
                    </>
                  );
                })()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="mt-2 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                {reportTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleSelectReport(type.id)}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium border-b last:border-b-0 ${
                        selectedReport === type.id
                          ? 'text-yellow-600 bg-yellow-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* --- Render Standard Report Content --- */}
        {selectedReport !== 'receiptAudit' && (
           <div id="report-content" className="p-6">
              {renderCurrentReport()}
          </div>
        )}

        {/* --- ADDED: Receipt Audit Section --- */}
        {selectedReport === 'receiptAudit' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Receipt Audit & Reprint</h3>
            
            {/* Filter Form */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label htmlFor="receipt_start_date" className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                <input
                  type="datetime-local"
                  id="receipt_start_date"
                  value={receiptStartDate}
                  onChange={(e) => setReceiptStartDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="receipt_end_date" className="block text-sm font-medium text-gray-700">End Date & Time</label>
                <input
                  type="datetime-local"
                  id="receipt_end_date"
                  value={receiptEndDate}
                  onChange={(e) => setReceiptEndDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="receipt_order_type" className="block text-sm font-medium text-gray-700">Order Type</label>
                <select
                  id="receipt_order_type"
                  value={receiptOrderType}
                  onChange={(e) => setReceiptOrderType(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="dine_in">Dine-In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                  <option value="room_service">Room Service</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="receipt_customer_name" className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  id="receipt_customer_name"
                  value={receiptCustomerName}
                  onChange={(e) => setReceiptCustomerName(e.target.value)}
                  placeholder="Search by name..."
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                />
              </div>
              
              <div className="self-end">
                <button
                  onClick={handleSearchReceipts}
                  disabled={receiptLoading}
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {receiptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" /> }
                  {receiptLoading ? 'Searching...' : 'Search Receipts'}
                </button>
              </div>
              </div>
            </div>

            {/* Error Message */}
            {receiptError && (
               <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{receiptError}</span>
               </div>
            )}

            {/* Loading Indicator */}
            {receiptLoading && (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="ml-3 text-gray-600">Fetching receipts...</p>
              </div>
            )}

            {/* Results Table - Mobile Responsive */}
            {!receiptLoading && receipts.length > 0 && (
              <div className="overflow-x-auto border rounded-lg">
                <div className="hidden md:block max-h-96 overflow-y-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {receipts.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' :
                              order.order_type === 'takeaway' ? 'bg-green-100 text-green-800' :
                              order.order_type === 'delivery' ? 'bg-yellow-100 text-yellow-800' :
                              order.order_type === 'room_service' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {formatOrderType(order.order_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{order.customer_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedReceipt(order)}
                                className="text-indigo-600 hover:text-indigo-900 hover:underline"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleGenerateInvoice(order.id)}
                                className="text-blue-600 hover:text-blue-900 hover:underline"
                              >
                                Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 bg-white">
                  {receipts.map((order) => (
                    <div key={order.id} className="p-4 space-y-2 border-b">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 break-words">{order.order_number}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' :
                          order.order_type === 'takeaway' ? 'bg-green-100 text-green-800' :
                          order.order_type === 'delivery' ? 'bg-yellow-100 text-yellow-800' :
                          order.order_type === 'room_service' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formatOrderType(order.order_type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Customer:</span> {order.customer_name || 'N/A'}</p>
                        <p><span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleString()}</p>
                        <p><span className="font-medium">Total:</span> {formatCurrency(order.total_amount)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedReceipt(order)}
                          className="flex-1 mt-3 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          View Receipt
                        </button>
                        <button
                          onClick={() => handleGenerateInvoice(order.id)}
                          className="flex-1 mt-3 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
             {!receiptLoading && !receiptError && receipts.length === 0 && receiptStartDate && receiptEndDate && (
               <div className="text-center py-10 text-gray-500">
                  No completed receipts found for the selected date range.
               </div>
             )}
              {/* Initial message before searching */}
             {!receiptLoading && !receiptError && receipts.length === 0 && !receiptStartDate && !receiptEndDate && (
                <div className="text-center py-10 text-gray-400">
                    Select a date range and click "Search Receipts" to audit past orders.
                </div>
              )}

          </div>
        )}
      </div>

      {/* ReceiptModal - Format order data for receipt display */}
      {selectedReceipt && (
        <ReceiptModal
          receiptData={{
            orderId: selectedReceipt.id,
            orderNumber: selectedReceipt.order_number || 'N/A',
            customerName: selectedReceipt.customer_name || undefined,
            items: (selectedReceipt.items || []).map((item: any) => ({
              name: item.product_name || 'Unknown Item',
              quantity: item.quantity || 0,
              unitPrice: Number(item.unit_price) || 0,
              totalPrice: Number(item.total_price) || 0
            })),
            subtotal: selectedReceipt.items?.reduce((sum: number, item: any) => sum + (Number(item.total_price) || 0), 0) || 0,
            total: Number(selectedReceipt.total_amount) || 0,
            paymentMethod: selectedReceipt.payment_method || 'cash',
            staffName: selectedReceipt.staff_name || 'Quick POS',
            createdAt: selectedReceipt.created_at || new Date().toISOString(),
            orderType: selectedReceipt.order_type || 'general'
          }}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {selectedInvoiceId && (
        <InvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}
