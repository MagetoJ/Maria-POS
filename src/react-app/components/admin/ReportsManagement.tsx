import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Package, Bed, Loader2, AlertTriangle, Printer } from 'lucide-react';
// --- MODIFIED: Import new fetchReceiptsByDate function ---
import { apiClient, fetchReceiptsByDate } from '../../config/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// --- ADDED: Import ReceiptModal ---
import ReceiptModal from '../receptionist/ReceiptModal';
// --- CORRECTED: Use 'any' for now as 'Order' is not exported from shared/types ---
// import { Order as OrderType } from '../../../shared/types'; // Corrected import (assuming name)
type OrderType = any; // Using 'any' as a temporary fix

// Format currency function (assuming KES)
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return 'KES 0';
  }
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
  sales: { monthly: number };
  orders: { total: number; completed: number; averageValue: number };
  inventory: { topSellingItems: { name: string; quantity: number; revenue: number }[] };
  staff: { topPerformers: { name: string; orders: number; revenue: number }[] };
}

interface SalesReportData {
  salesByDay: { date: string; total: number }[];
}

interface InventoryReportData {
    lowStockItems: { id: number; name: string; current_stock: number; minimum_stock: number }[];
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

export default function ReportsManagement() {
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Default to false initially
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState('overview');
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
  // Optional: Add pagination state if needed
  // const [receiptPage, setReceiptPage] = useState(0);
  // const [receiptTotal, setReceiptTotal] = useState(0);

  useEffect(() => {
    // Fetch regular reports when selection or date changes
     if (selectedReport !== 'receiptAudit') { // Only fetch standard reports if not on audit tab
        fetchReportData();
     } else {
       // Reset standard report loading state if switching to audit tab
       setIsLoading(false); // Ensure loading is false
       setError(null);
       setReportData(null);
     }
  }, [selectedReport, dateRange.start, dateRange.end]);

 // Fetch overview report on initial load
 useEffect(() => {
    // Only fetch overview if it's the selected report initially
    if (selectedReport === 'overview') {
        fetchReportData();
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []); // Run only once on mount

  const fetchReportData = async () => {
    // Prevent fetching if receipt audit tab is selected initially
    if (selectedReport === 'receiptAudit') {
        setIsLoading(false); // Ensure loading state is reset if switching to audit tab
        return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null); // Clear previous report data

    const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
    }).toString();

    try {
      // Use the correct /api prefix for standard reports
      const endpoint = `/api/reports/${selectedReport}?${query}`;
      console.log('Fetching report from:', endpoint);
      
      const response = await apiClient.get(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
         // Attempt to parse HTML error for better feedback
        if (errorText.toLowerCase().includes('forbidden') || response.status === 403) {
             throw new Error(`Access Denied (403): You might not have the required permissions for this report.`);
         } else if (response.status === 401) {
             throw new Error(`Authentication Required (401): Please log in again.`);
         }
        throw new Error(`Failed to fetch report data: ${response.status} - ${errorText.substring(0, 100)}...`); // Show snippet
      }
      
      // --- WRAP JSON PARSING IN TRY/CATCH ---
      try {
        const data = await response.json();
        console.log('Report data received:', selectedReport, data);
        setReportData(data);
      } catch (jsonError) {
          console.error("JSON Parsing Error:", jsonError);
          // Check if it's the specific HTML error
           if (jsonError instanceof SyntaxError && jsonError.message.includes("token '<'")) {
               throw new Error('Received an invalid response (HTML instead of JSON). Check server logs and authentication.');
           } else {
               throw new Error('Failed to parse server response.'); // Generic parse error
           }
      }
    } catch (err) {
       let specificError = 'Failed to fetch report data. Please check the console.';
       // Use the error message directly if it was already processed
       if (err instanceof Error) {
           specificError = err.message;
       }
      setError(specificError);
      console.error("Failed to fetch report data:", err); // Log original error too
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


  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'sales', label: 'Sales Report', icon: DollarSign },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'staff', label: 'Staff Performance', icon: Users },
    { id: 'rooms', label: 'Room Revenue', icon: Bed }
  ];

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
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
      } else {
        alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}... (Not yet implemented)`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };
  
  // --- Rendering functions for standard reports (renderOverviewReport, etc.) ---
  // --- Assume these exist as in your provided code ---
  const renderOverviewReport = () => { /* ... existing code ... */ 
    const data = reportData as OverviewReportData;
    if (!data || !data.sales || !data.orders || !data.inventory || !data.staff) {
        return <div className="text-center py-8">No data available for the selected period.</div>;
    }
    return (
        <div className="space-y-6">
            {/* ... rest of the overview JSX ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.sales?.monthly || 0)}</p>
                        </div>
                    </div>
                </div>
                {/* Other stat boxes */}
                 <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{data.orders?.total || 0}</p>
                        </div>
                    </div>
                     {(data.orders?.total || 0) > 0 &&
                        <div className="mt-4">
                             <span className="text-blue-500 text-sm">{(((data.orders?.completed || 0) / (data.orders?.total || 1)) * 100).toFixed(1)}% completion rate</span>
                        </div>
                     }
                </div>
                 <div className="bg-white rounded-lg p-6 border border-gray-200">
                     <div className="flex items-center">
                         <div className="p-2 bg-purple-100 rounded-lg"><DollarSign className="w-6 h-6 text-purple-600" /></div>
                         <div className="ml-4">
                             <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                             <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.orders?.averageValue || 0)}</p>
                         </div>
                     </div>
                 </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Top Selling Items */}
                 <div className="bg-white rounded-lg p-6 border border-gray-200">
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
                 {/* Top Staff Performance */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
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
  // --- END of standard report rendering functions ---


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

    if (!reportData && selectedReport !== 'receiptAudit') { // Don't show if receipt audit is active and no data yet
      return <div className="text-center py-20 text-gray-500">Select a date range to generate a report.</div>;
    }

    // --- MODIFIED: Added case for 'receiptAudit' ---
    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'staff':
        return renderStaffReport();
      case 'rooms':
        return renderRoomReport();
      case 'receiptAudit': // Render nothing here, handled separately below
        return null;
      default: // Overview
        return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6 p-4"> {/* Added padding */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"> {/* Responsive layout */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and export comprehensive business reports</p>
        </div>
        {/* Only show PDF export for standard reports */}
        {selectedReport !== 'receiptAudit' && reportData && ( // Only show if data exists
          <div className="flex gap-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isLoading} // Disable while loading
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50" // Smaller text
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
          </div>
        )}
      </div>

      {/* Standard Report Date Range Picker (Only shown for standard reports) */}
      {selectedReport !== 'receiptAudit' && (
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
          <nav className="flex overflow-x-auto">
            {/* Standard Report Types */}
            {reportTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
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
            {/* --- ADDED: Receipt Audit Tab --- */}
            <button
              key="receiptAudit"
              onClick={() => setSelectedReport('receiptAudit')}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm font-medium whitespace-nowrap ${
                selectedReport === 'receiptAudit'
                  ? 'text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Printer className="w-4 h-4" />
              Receipt Audit
            </button>
          </nav>
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

            {/* Results Table */}
            {!receiptLoading && receipts.length > 0 && (
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10"> {/* Added z-10 */}
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receipts.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedReceipt(order)}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline"
                          >
                            View/Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* ReceiptModal - using the formatted receiptData from backend */}
      {selectedReceipt && (
        <ReceiptModal
          receiptData={selectedReceipt.receiptData}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

