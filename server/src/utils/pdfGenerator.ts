import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date: string;
  order_number: string | null;
  customer_name?: string;
  customer_phone?: string;
  billing_address?: string;
  event_type?: string;
  event_price?: number;
  status: string;
  items: any[];
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
}

interface BusinessSettings {
  business_name: string;
  business_phone: string;
  business_email: string;
  business_paybill: string;
  business_account_number: string;
  business_address?: string;
}

export const generateInvoicePDF = async (invoice: InvoiceData, settings: BusinessSettings): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    const safeSettings = {
      business_name: settings?.business_name || 'MARIA HAVENS',
      business_phone: settings?.business_phone || '0719431878',
      business_email: settings?.business_email || 'info@mariahavens.com',
      business_paybill: settings?.business_paybill || 'N/A',
      business_account_number: settings?.business_account_number || 'N/A'
    };

    const safeDate = (date: any) => {
      try {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
      } catch (e) {
        return 'N/A';
      }
    };

    // --- Header ---
    doc.fillColor('#444444')
       .fontSize(20)
       .text(safeSettings.business_name.toUpperCase(), 50, 50, { align: 'left' })
       .fontSize(10)
       .text('Restaurant & Hotel', 50, 75)
       .text(safeSettings.business_email, 50, 90)
       .text(safeSettings.business_phone, 50, 105);

    doc.fontSize(30)
       .fillColor('#cccccc')
       .text('INVOICE', 50, 50, { align: 'right' });

    doc.moveTo(50, 130).lineTo(550, 130).stroke('#eeeeee');

    // --- Invoice Info ---
    doc.fillColor('#444444')
       .fontSize(10)
       .text(`Invoice #: ${invoice.invoice_number}`, 350, 150, { align: 'right' })
       .text(`Date: ${safeDate(invoice.created_at)}`, 350, 165, { align: 'right' })
       .text(`Due Date: ${safeDate(invoice.due_date)}`, 350, 180, { align: 'right' })
       .text(`Ref: ${invoice.order_number || 'Manual Event'}`, 350, 195, { align: 'right' });

    // --- Billing Info ---
    doc.fontSize(12)
       .fillColor('#888888')
       .text('BILL TO:', 50, 150)
       .fillColor('#000000')
       .fontSize(14)
       .text(invoice.customer_name || 'Valued Customer', 50, 165)
       .fontSize(10)
       .fillColor('#444444');
    
    if (invoice.customer_phone) doc.text(invoice.customer_phone, 50, 185);
    if (invoice.billing_address) doc.text(invoice.billing_address, 50, 200, { width: 250 });

    // --- Table Header ---
    const tableTop = 260;
    doc.fillColor('#f8f9fa')
       .rect(50, tableTop, 500, 20)
       .fill();

    doc.fillColor('#666666')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Description', 60, tableTop + 5)
       .text('Qty', 300, tableTop + 5)
       .text('Unit Price', 380, tableTop + 5, { width: 80, align: 'right' })
       .text('Total', 470, tableTop + 5, { width: 70, align: 'right' });

    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke('#000000');

    // --- Table Rows ---
    let y = tableTop + 30;
    doc.font('Helvetica');

    // Show manual event row if present
    if (invoice.event_type) {
      doc.fillColor('#444444')
         .text(invoice.event_type, 60, y)
         .text('1', 300, y)
         .text(Number(invoice.event_price).toLocaleString(), 380, y, { width: 80, align: 'right' })
         .text(Number(invoice.event_price).toLocaleString(), 470, y, { width: 70, align: 'right' });
      
      y += 20;
      doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke('#eeeeee');
    }

    if (invoice.items) {
      invoice.items.forEach(item => {
        const itemTotal = Number(item.total_price || (item.quantity * item.unit_price));
        
        doc.fillColor('#444444')
           .text(item.product_name || 'Item', 60, y)
           .text(item.quantity.toString(), 300, y)
           .text(Number(item.unit_price).toLocaleString(), 380, y, { width: 80, align: 'right' })
           .text(itemTotal.toLocaleString(), 470, y, { width: 70, align: 'right' });
        
        y += 20;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke('#eeeeee');
      });
    }

    // --- Totals ---
    const totalsY = y + 20;
    const subtotalValue = Number(invoice.subtotal || invoice.event_price || 0);
    doc.fontSize(10)
       .text('Subtotal:', 350, totalsY)
       .text(subtotalValue.toLocaleString(), 470, totalsY, { width: 70, align: 'right' });

    if (invoice.tax_amount > 0) {
      doc.text('Tax:', 350, totalsY + 15)
         .text(invoice.tax_amount.toLocaleString(), 470, totalsY + 15, { width: 70, align: 'right' });
    }

    if (invoice.service_charge > 0) {
      doc.text('Service Charge:', 350, totalsY + 30)
         .text(invoice.service_charge.toLocaleString(), 470, totalsY + 30, { width: 70, align: 'right' });
    }

    if (invoice.discount_amount > 0) {
      doc.fillColor('#ff0000')
         .text('Discount:', 350, totalsY + 45)
         .text(`-${invoice.discount_amount.toLocaleString()}`, 470, totalsY + 45, { width: 70, align: 'right' });
    }

    doc.fillColor('#000000')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOTAL:', 350, totalsY + 65)
       .text(`KES ${invoice.total_amount.toLocaleString()}`, 450, totalsY + 65, { width: 90, align: 'right' });

    // --- Payment Info ---
    const footerY = 650;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#888888')
       .text('PAYMENT INSTRUCTIONS:', 50, footerY)
       .font('Helvetica')
       .fillColor('#444444')
       .text(`M-PESA Paybill: ${safeSettings.business_paybill}`, 50, footerY + 20)
       .text(`Account Number: ${safeSettings.business_account_number}-${invoice.invoice_number}`, 50, footerY + 35);

    // --- Notes ---
    doc.font('Helvetica-Bold')
       .fillColor('#888888')
       .text('NOTES:', 300, footerY)
       .font('Helvetica-Oblique')
       .fillColor('#444444')
       .text(invoice.notes || 'Thank you for your business. Please make payment within the due date.', 300, footerY + 20, { width: 250 });

    // --- Footer ---
    doc.fontSize(8)
       .fillColor('#aaaaaa')
       .text('Generated by Maria POS System', 50, 780, { align: 'center' });

    doc.end();
  });
};
