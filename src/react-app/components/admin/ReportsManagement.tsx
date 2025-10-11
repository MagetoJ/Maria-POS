// COMPLETE REPLACEMENT for your ReportsManagement.tsx
// This version has better error handling and null checks

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Package, Bed, Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange.start, dateRange.end]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('pos_token');

    const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
    }).toString();

    try {
      const endpoint = `/api/reports/${selectedReport}?${query}`;
      console.log('Fetching report from:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Report fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch report data: ${response.status}`);
      }

      const data = await response.json();
      console.log('Report data received:', selectedReport, data);
      setReportData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error("Failed to fetch report data:", err);
    } finally {
      setIsLoading(false);
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
        // Get the report content element
        const reportElement = document.getElementById('report-content');
        if (!reportElement) {
          alert('Report content not found');
          return;
        }

        // Create canvas from the report element
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });

        // Calculate PDF dimensions
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save the PDF
        const fileName = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        alert('PDF export successful!');
      } else {
        // For CSV and Excel, show not implemented message
        alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}... (Not yet implemented)`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };
  
  const renderOverviewReport = () => {
    const data = reportData as OverviewReportData;
    
    // Add null/undefined check
    if (!data || !data.sales || !data.orders || !data.inventory || !data.staff) {
      return <div className="text-center py-8">No data available</div>;
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.sales?.monthly || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.orders?.averageValue || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  }

  const renderSalesReport = () => {
    if (!reportData || !reportData.salesByDay) {
      return <div className="text-center py-10 text-gray-500">No sales data available</div>;
    }
    
    const data = reportData as SalesReportData;
    
    if (data.salesByDay.length === 0) {
      return <div className="text-center py-10 text-gray-500">No sales in this date range</div>;
    }
    
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
  
  const renderInventoryReport = () => {
    if (!reportData) {
      return <div className="text-center py-10 text-gray-500">No inventory data available</div>;
    }
    
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
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalValue || 0)}</div>
                <div className="text-sm text-gray-600">Total Inventory Value</div>
            </div>
        </div>
    );
  };

  const renderStaffReport = () => {
    if (!reportData || !Array.isArray(reportData)) {
      return <div className="text-center py-10 text-gray-500">No staff data available</div>;
    }
    
    const data = reportData as StaffReportData[];
    
    if (data.length === 0) {
      return <div className="text-center py-10 text-gray-500">No staff activity in this date range</div>;
    }
    
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

  const renderRoomReport = () => {
    if (!reportData) {
      return <div className="text-center py-10 text-gray-500">No room data available</div>;
    }
    
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

  const renderCurrentReport = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="ml-4 text-gray-600">Generating report...</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="mt-4 font-semibold text-red-700">Failed to load report data</p>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (!reportData) {
      return <div className="text-center py-20 text-gray-500">No report data available for the selected period.</div>;
    }

    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'staff':
        return renderStaffReport();
      case 'rooms':
        return renderRoomReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
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
        </div>
      </div>

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

        <div id="report-content" className="p-6">
          {renderCurrentReport()}
        </div>
      </div>
    </div>
  );
}