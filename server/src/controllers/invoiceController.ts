import { Request, Response } from 'express';
import db from '../db';
import { getAllSettingsInternal } from './settingsController';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { sendInvoiceEmail } from '../utils/email';

// Generate a unique invoice number
export const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice number for this year/month
  const lastInvoice = await db('invoices')
    .whereRaw("invoice_number LIKE ?", [`INV-${year}${month}-%`])
    .orderBy('invoice_number', 'desc')
    .first();

  let sequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoice_number.split('-');
    const lastSequence = parseInt(parts[parts.length - 1]);
    sequence = lastSequence + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(3, '0')}`;
};

// Create a new invoice from an order
export const createInvoice = async (req: Request, res: Response) => {
  const { order_id, due_date, billing_address, notes, customer_email } = req.body;

  try {
    // Check if order exists
    const order = await db('orders').where({ id: order_id }).first();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await db('invoices').where({ order_id }).first();
    if (existingInvoice) {
      return res.status(400).json({ 
        message: 'Invoice already exists for this order',
        invoice: existingInvoice 
      });
    }

    const invoice_number = await generateInvoiceNumber();

    const [invoice] = await db('invoices')
      .insert({
        order_id,
        invoice_number,
        due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days due
        billing_address,
        notes,
        customer_email: customer_email || order.customer_email,
        status: 'unpaid',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ message: 'Error creating invoice' });
  }
};

// Get all invoices with filtering
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      start_date, 
      end_date,
      limit = 50,
      offset = 0 
    } = req.query;

    let query = db('invoices')
      .select('invoices.*', 'orders.order_number', 'orders.total_amount', 'orders.customer_name')
      .leftJoin('orders', 'invoices.order_id', 'orders.id')
      .orderBy('invoices.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (status) {
      query = query.where('invoices.status', status);
    }

    if (start_date && end_date) {
      query = query.whereBetween('invoices.created_at', [start_date, end_date]);
    }

    const invoices = await query;
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

// Get invoice by ID with full details
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await db('invoices')
      .select('invoices.*', 'orders.order_number', 'orders.total_amount', 'orders.subtotal', 'orders.tax_amount', 'orders.service_charge', 'orders.discount_amount', 'orders.customer_name', 'orders.customer_phone')
      .leftJoin('orders', 'invoices.order_id', 'orders.id')
      .where('invoices.id', id)
      .first();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Get order items
    invoice.items = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .where('order_id', invoice.order_id)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    // Get payments
    invoice.payments = await db('payments')
      .where('order_id', invoice.order_id)
      .select('*');

    res.json(invoice);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['unpaid', 'partial', 'paid', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [updatedInvoice] = await db('invoices')
      .where({ id })
      .update({ 
        status, 
        updated_at: new Date() 
      })
      .returning('*');

    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(updatedInvoice);
  } catch (err) {
    console.error('Error updating invoice status:', err);
    res.status(500).json({ message: 'Error updating invoice status' });
  }
};

// Email invoice as PDF
export const emailInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Get full invoice details
    const invoice = await db('invoices')
      .select('invoices.*', 'orders.order_number', 'orders.total_amount', 'orders.subtotal', 'orders.tax_amount', 'orders.service_charge', 'orders.discount_amount', 'orders.customer_name', 'orders.customer_phone')
      .leftJoin('orders', 'invoices.order_id', 'orders.id')
      .where('invoices.id', id)
      .first();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const recipientEmail = email || invoice.customer_email;
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    // Get order items
    invoice.items = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .where('order_id', invoice.order_id)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    // Get business settings
    const settings = await getAllSettingsInternal();
    
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, settings as any);

    // Send email
    const success = await sendInvoiceEmail(recipientEmail, invoice.invoice_number, pdfBuffer);

    if (success) {
      // Update customer_email if it was provided and different
      if (email && email !== invoice.customer_email) {
        await db('invoices').where({ id }).update({ customer_email: email });
      }
      res.json({ message: 'Invoice emailed successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send invoice email' });
    }
  } catch (err) {
    console.error('Error emailing invoice:', err);
    res.status(500).json({ message: 'Error emailing invoice' });
  }
};

// Download invoice as PDF
export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get full invoice details
    const invoice = await db('invoices')
      .select('invoices.*', 'orders.order_number', 'orders.total_amount', 'orders.subtotal', 'orders.tax_amount', 'orders.service_charge', 'orders.discount_amount', 'orders.customer_name', 'orders.customer_phone')
      .leftJoin('orders', 'invoices.order_id', 'orders.id')
      .where('invoices.id', id)
      .first();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Get order items
    invoice.items = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .where('order_id', invoice.order_id)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    // Get business settings
    const settings = await getAllSettingsInternal();
    
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, settings as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoice_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error downloading invoice:', err);
    res.status(500).json({ message: 'Error downloading invoice' });
  }
};
