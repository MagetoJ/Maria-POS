import { X, Printer, Download, Mail, Loader2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';

interface InvoiceModalProps {
  invoiceId: number;
  onClose: () => void;
}

export default function InvoiceModal({ invoiceId, onClose }: InvoiceModalProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
    fetchSettings();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      const response = await apiClient.get(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      }
    } catch (err) {
      console.error('Failed to fetch invoice details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings/public');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    return `KES ${safeAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-document')?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${invoice.invoice_number}</title>
          <style>
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 40px; 
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              border-bottom: 2px solid #eee;
              padding-bottom: 20px;
            }
            .business-info h1 { margin: 0; color: #000; font-size: 24px; }
            .business-info p { margin: 5px 0; font-size: 14px; color: #666; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { margin: 0; color: #000; font-size: 20px; }
            .invoice-info p { margin: 5px 0; font-size: 14px; }
            
            .billing-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .bill-to h3 { margin: 0 0 10px 0; font-size: 16px; text-transform: uppercase; color: #888; }
            .bill-to p { margin: 5px 0; font-size: 15px; }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            th {
              background-color: #f8f9fa;
              text-align: left;
              padding: 12px;
              border-bottom: 2px solid #dee2e6;
              font-size: 14px;
              text-transform: uppercase;
              color: #666;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #dee2e6;
              font-size: 14px;
            }
            .text-right { text-align: right; }
            
            .totals-section {
              display: flex;
              justify-content: flex-end;
            }
            .totals-table {
              width: 300px;
            }
            .totals-table tr td { border: none; padding: 8px 12px; }
            .totals-table tr.grand-total td {
              border-top: 2px solid #000;
              font-weight: bold;
              font-size: 18px;
              color: #000;
              padding-top: 15px;
            }

            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #888;
              text-align: center;
            }
            .payment-info {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await apiClient.get(`/api/invoices/${invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoice.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download PDF");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    const email = window.prompt("Enter customer email address:", invoice.customer_email || "");
    if (!email) return;

    setIsEmailing(true);
    try {
      const response = await apiClient.post(`/api/invoices/${invoiceId}/email`, { email });
      if (response.ok) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to send email");
      }
    } catch (err) {
      console.error("Email error:", err);
      alert("Error sending email");
    } finally {
      setIsEmailing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]">
        <div className="bg-white p-8 rounded-lg">
          <p className="text-lg">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const itemsTotal = invoice.items?.reduce((sum: number, item: any) => sum + (Number(item.total_price) || 0), 0) || 0;
  const subtotalValue = invoice.order_id 
    ? (Number(invoice.subtotal) || itemsTotal)
    : ((Number(invoice.event_price) || 0) + itemsTotal);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-[70] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col my-auto md:my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="text-lg font-bold">Invoice: {invoice.invoice_number}</h3>
          <div className="flex gap-2">
            <button
              onClick={handleSendEmail}
              disabled={isEmailing}
              className={`flex items-center gap-2 px-4 py-2 ${emailSuccess ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50`}
            >
              {isEmailing ? <Loader2 className="w-4 h-4 animate-spin" /> : emailSuccess ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              {isEmailing ? 'Sending...' : emailSuccess ? 'Sent!' : 'Email PDF'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Document Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-gray-50 scroll-smooth">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 max-w-[800px] mx-auto no-print sticky top-0 bg-gray-50 py-4 z-10 border-b border-gray-200">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md"
            >
              <Printer className="w-5 h-5" />
              Print Invoice Now
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-bold shadow-sm"
            >
              <X className="w-5 h-5" />
              Close Preview
            </button>
          </div>

          <div id="invoice-document" className="bg-white shadow-sm mx-auto p-6 lg:p-12 min-h-[1056px] w-full max-w-[800px] text-gray-800 font-sans">
            {/* Business Header */}
            <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-gray-100">
              <div className="business-info">
                <h1 className="text-3xl font-black text-gray-900 mb-2">{settings.business_name || 'MARIA HAVENS'}</h1>
                <p className="text-gray-600">Restaurant & Hotel</p>
                <p className="text-gray-600">{settings.business_email || 'info@mariahavens.com'}</p>
                <p className="text-gray-600">{settings.business_phone || '0719431878'}</p>
              </div>
              <div className="invoice-info text-right">
                <h2 className="text-4xl font-light text-gray-400 uppercase tracking-widest mb-4">Invoice</h2>
                <div className="space-y-1">
                  <p><span className="font-semibold">Invoice #:</span> {invoice.invoice_number}</p>
                  <p><span className="font-semibold">Date:</span> {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-KE') : 'N/A'}</p>
                  <p><span className="font-semibold">Due Date:</span> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-KE') : 'N/A'}</p>
                  <p><span className="font-semibold">Reference:</span> {invoice.order_number || invoice.event_type || 'Manual Event'}</p>
                </div>
              </div>
            </div>

            {/* Billing Section */}
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="bill-to">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To:</h3>
                <p className="text-lg font-bold text-gray-900">{invoice.customer_name || 'Valued Customer'}</p>
                {invoice.customer_phone && <p className="text-gray-600">{invoice.customer_phone}</p>}
                {invoice.customer_email && <p className="text-gray-600">{invoice.customer_email}</p>}
                {invoice.billing_address && (
                  <p className="text-gray-600 mt-2 whitespace-pre-wrap">{invoice.billing_address}</p>
                )}
              </div>
              <div className="payment-status text-right">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status:</h3>
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold uppercase ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-4 text-left font-bold text-gray-900 bg-transparent border-none">Description</th>
                  <th className="py-4 text-center font-bold text-gray-900 bg-transparent border-none">Quantity</th>
                  <th className="py-4 text-right font-bold text-gray-900 bg-transparent border-none">Unit Price</th>
                  <th className="py-4 text-right font-bold text-gray-900 bg-transparent border-none">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Show manual event details if present */}
                {invoice.event_type && Number(invoice.event_price) > 0 && (
                  <tr className="bg-blue-50/30">
                    <td className="py-4 font-bold text-blue-900">{invoice.event_type} Package</td>
                    <td className="py-4 text-center">1</td>
                    <td className="py-4 text-right">{formatCurrency(invoice.event_price)}</td>
                    <td className="py-4 text-right font-bold text-blue-900">{formatCurrency(invoice.event_price)}</td>
                  </tr>
                )}
                {invoice.items && invoice.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-4 font-medium">{item.product_name}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-12">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotalValue)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.service_charge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Service Charge:</span>
                    <span>{formatCurrency(invoice.service_charge)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-4 border-t-2 border-gray-900">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment & Notes */}
            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-gray-100">
              <div className="payment-instructions">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Instructions:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold mb-1">M-PESA Paybill:</p>
                  <p className="text-lg text-blue-700 font-black mb-3">{settings.business_paybill || '100400'}</p>
                  <p className="font-bold mb-1">Account Number:</p>
                  <p className="text-lg text-blue-700 font-black">{settings.business_account_number || 'MH-' + invoice.invoice_number}</p>
                </div>
              </div>
              <div className="notes">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Notes:</h3>
                <p className="text-gray-600 italic">
                  {invoice.notes || "Thank you for your business. Please make payment within the due date to avoid service interruption."}
                </p>
              </div>
            </div>

            <div className="footer mt-24 text-center text-gray-400 text-sm">
              <p>Generated by Maria POS System</p>
              <p>&copy; {new Date().getFullYear()} {settings.business_name || 'MARIA HAVENS'}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-bold"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
