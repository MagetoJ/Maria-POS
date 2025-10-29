import { X, Printer } from 'lucide-react';

interface ReceiptModalProps {
  receiptData: {
    orderNumber: string;
    customerName?: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    total: number;
    paymentMethod: string;
    staffName: string;
    createdAt: string;
    orderType?: string;
  };
  onClose: () => void;
}

export default function ReceiptModal({ receiptData, onClose }: ReceiptModalProps) {
  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const getReceiptTitle = (orderType?: string) => {
    switch (orderType) {
      case 'dine_in':
        return 'Dine-In Receipt';
      case 'takeaway':
        return 'Takeaway Receipt';
      case 'delivery':
        return 'Delivery Receipt';
      case 'room_service':
        return 'Room Service Receipt';
      default:
        return 'Sales Receipt';
    }
  };

  const handlePrint = () => {
    const customerLine = receiptData.customerName ? `<div>Customer: ${receiptData.customerName}</div>` : '';
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData.orderNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 300px; margin: 0; padding: 10px; font-size: 12px; }
          .receipt { text-align: center; }
          .logo {
            max-width: 120px; 
            height: auto;
            margin: 0 auto 10px;
            display: block;
          }
          .header { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
          .subheader { font-size: 12px; margin-bottom: 10px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .order-info { text-align: left; margin: 8px 0; font-size: 11px; }
          .items { text-align: left; }
          .item-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 3px 0;
            font-size: 11px;
          }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 60px; text-align: right; }
          .totals { margin-top: 8px; font-weight: bold; font-size: 12px; }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 3px 0; 
          }
          .grand-total { 
            font-size: 14px; 
            border-top: 1px solid #000; 
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer { 
            margin-top: 15px; 
            font-size: 10px; 
            text-align: center;
            font-style: italic;
          }
          .payment-info {
            margin: 8px 0;
            font-size: 11px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <img src="/logo.PNG" alt="Restaurant Logo" class="logo" />
          <div class="header">MARIA HAVENS</div>
          <div class="subheader">Restaurant & Hotel</div>
          <div class="subheader">${getReceiptTitle(receiptData.orderType)}</div>
          <div class="divider"></div>
          
          <div class="order-info">
            <div><strong>Receipt:</strong> ${receiptData.orderNumber}</div>
            <div><strong>Date:</strong> ${new Date(receiptData.createdAt).toLocaleString('en-KE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
            <div><strong>Served by:</strong> ${receiptData.staffName}</div>
            ${customerLine}
            <div><strong>Payment:</strong> ${receiptData.paymentMethod.toUpperCase()}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            ${receiptData.items.map(item => `
              <div class="item-row">
                <div class="item-name">${item.name}</div>
                <div class="item-qty">${item.quantity}x</div>
                <div class="item-price">${formatCurrency(item.totalPrice)}</div>
              </div>
              <div style="font-size: 10px; color: #666; margin-left: 10px;">
                @ ${formatCurrency(item.unitPrice)} each
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <div>Subtotal:</div>
              <div>${formatCurrency(receiptData.subtotal)}</div>
            </div>

            <div class="total-row grand-total">
              <div>TOTAL:</div>
              <div>${formatCurrency(receiptData.total)}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div>Thank you for your visit!</div>
            <div>Please come again</div>
            <div style="margin-top: 10px;">• • • • •</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            // Wait for logo to load before printing
            const logo = document.querySelector('.logo');
            if (logo) {
              logo.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 100);
                }, 500);
              };
              // If logo is already loaded
              if (logo.complete) {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 100);
                }, 500);
              }
            } else {
              // Fallback if no logo
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 100);
              }, 500);
            }
          }
        </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Receipt Preview</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-center">
            {/* Logo */}
            <div className="mb-3">
              <img src="/logo.PNG" alt="Restaurant Logo" className="h-16 mx-auto" />
            </div>
            
            {/* Header */}
            <div className="font-bold text-sm mb-1">MARIA HAVENS</div>
            <div className="text-xs mb-2">Restaurant & Hotel</div>
            <div className="text-xs mb-3">{getReceiptTitle(receiptData.orderType)}</div>
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            
            {/* Order Info */}
            <div className="text-left text-xs space-y-1 mb-3">
              <div><span className="font-semibold">Receipt:</span> {receiptData.orderNumber}</div>
              <div><span className="font-semibold">Date:</span> {new Date(receiptData.createdAt).toLocaleString('en-KE')}</div>
              <div><span className="font-semibold">Served by:</span> {receiptData.staffName}</div>
              {receiptData.customerName && (
                <div><span className="font-semibold">Customer:</span> {receiptData.customerName}</div>
              )}
              <div><span className="font-semibold">Payment:</span> {receiptData.paymentMethod.toUpperCase()}</div>
            </div>
            
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            
            {/* Items */}
            <div className="text-left space-y-1 mb-3">
              {receiptData.items.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{item.quantity}x</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                  <div className="text-gray-500 text-xs ml-2">
                    @ {formatCurrency(item.unitPrice)} each
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            
            {/* Totals */}
            <div className="text-left space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptData.subtotal)}</span>
              </div>

              <div className="border-t border-gray-400 pt-1 mt-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            
            <div className="text-xs italic mt-3">
              <div>Thank you for your visit!</div>
              <div>Please come again</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}