import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import { 
  FileText, 
  Search, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';
import InvoiceModal from './InvoiceModal';

interface Invoice {
  id: number;
  order_id: number | null;
  invoice_number: string;
  due_date: string;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  billing_address: string;
  notes: string;
  order_number: string | null;
  total_amount: number;
  customer_name: string;
  event_name?: string;
  event_price?: number;
  customer_email?: string;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
  status: string;
  payment_status: string;
}

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateView, setShowCreateView] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  
  // Form state for creating invoice
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState({
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billing_address: '',
    notes: '',
    event_name: '',
    event_price: '',
    customer_name: '',
    customer_email: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/invoices';
      if (filterStatus !== 'all') {
        url += `?status=${filterStatus}`;
      }
      const response = await apiClient.get(url);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        throw new Error('Failed to fetch invoices');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await apiClient.get('/api/orders/recent/all?limit=50');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent orders:', err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId && !invoiceFormData.event_name) {
      setError('Please select an order or provide manual event details');
      return;
    }

    try {
      const response = await apiClient.post('/api/invoices', {
        order_id: selectedOrderId,
        ...invoiceFormData,
        event_price: invoiceFormData.event_price ? parseFloat(invoiceFormData.event_price) : null
      });

      if (response.ok) {
        const newInvoice = await response.json();
        setShowCreateView(false);
        setSelectedOrderId(null);
        await fetchInvoices();
        setSelectedInvoiceId(newInvoice.id);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create invoice');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateInvoiceStatus = async (id: number, status: string) => {
    try {
      const response = await apiClient.put(`/api/invoices/${id}/status`, { status });
      if (response.ok) {
        await fetchInvoices();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.customer_name && inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    inv.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'unpaid':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> Unpaid</span>;
      case 'partial':
        return <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold"><Filter className="w-3 h-3" /> Partial</span>;
      case 'overdue':
        return <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoicing Management</h2>
          <p className="text-gray-600">Generate and track professional invoices for customer orders</p>
        </div>
        <button
          onClick={() => {
            setShowCreateView(true);
            fetchRecentOrders();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs font-bold uppercase">Dismiss</button>
        </div>
      )}

      {/* Main Content */}
      {!showCreateView ? (
        <>
          {/* Filters & Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice #, customer, or order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer / Order</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date / Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No invoices found</p>
                        <p className="text-sm">Try adjusting your filters or search query</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600">{inv.invoice_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{inv.customer_name || 'Walk-in Customer'}</div>
                          <div className="text-xs text-gray-500">{inv.order_number ? `Order: ${inv.order_number}` : 'Manual Event'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{new Date(inv.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-red-600 font-medium">Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{formatCurrency(inv.total_amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedInvoiceId(inv.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View/Print"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                            <select
                              value={inv.status}
                              onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                              className="text-xs border rounded px-1 py-1"
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="partial">Partial</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Create Invoice View */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={() => setShowCreateView(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h3 className="text-xl font-bold">New Invoice</h3>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Event Name Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Type (Manual Entry)</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding, Baby Shower, Corporate Party"
                  value={invoiceFormData.event_name}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, event_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Manual Price Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Price (KES)</label>
                <input
                  type="number"
                  placeholder="Key in price..."
                  value={invoiceFormData.event_price}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, event_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Manual Customer Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Customer Name (Manual)</label>
                <input
                  type="text"
                  placeholder="Enter customer name..."
                  value={invoiceFormData.customer_name}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Manual Customer Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Customer Email (Manual)</label>
                <input
                  type="email"
                  placeholder="Enter customer email..."
                  value={invoiceFormData.customer_email}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, customer_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Or Select Recent Order</label>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No recent orders found</div>
                ) : (
                  orders.map(order => (
                    <div 
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedOrderId === order.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div>
                        <div className="font-bold">{order.order_number}</div>
                        <div className="text-sm text-gray-500">{order.customer_name || 'Guest'} • {new Date(order.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(order.total_amount)}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.payment_status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={invoiceFormData.due_date}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Billing Address</label>
                <textarea
                  value={invoiceFormData.billing_address}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, billing_address: e.target.value })}
                  placeholder="Enter customer billing address details..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={invoiceFormData.notes}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                  placeholder="Internal notes or messages for the customer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={!selectedOrderId && !invoiceFormData.event_name}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
              >
                Generate Invoice
              </button>
              <button
                type="button"
                onClick={() => setShowCreateView(false)}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoiceId && (
        <InvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}
