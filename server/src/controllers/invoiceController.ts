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

// Create a new invoice from an order or from scratch with multiple items
export const createInvoice = async (req: Request, res: Response) => {
  const { 
    order_id, 
    items, // Array of { description, product_id, quantity, unit_price, total_price }
    due_date, 
    billing_address, 
    notes, 
    customer_email,
    customer_name,
    event_type,
    event_price,
    payment_method = 'cash',
    total_amount: provided_total
  } = req.body;

  try {
    let finalOrderId = order_id;
    let finalTotalAmount = provided_total;

    // Calculate total from items if not provided
    if (!finalTotalAmount && items && items.length > 0) {
      finalTotalAmount = items.reduce((sum: number, i: any) => sum + (Number(i.total_price) || Number(i.price) || (Number(i.unit_price) * Number(i.quantity)) || 0), 0);
    }

    if (!finalTotalAmount) finalTotalAmount = event_price || 0;

    await db.transaction(async (trx) => {
      // If items are provided without an order_id, AND it's not an explicit event (no event_type),
      // create a new order first for tracking
      if (!order_id && !event_type && items && items.length > 0) {
        const order_number = `ORD-${Date.now()}`;
        const total_amount = finalTotalAmount;
        const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.unit_price) * Number(item.quantity) || Number(item.price) || 0), 0);

        const [newOrder] = await trx('orders')
          .insert({
            order_number,
            order_type: 'quick_sale',
            status: 'completed',
            payment_status: 'unpaid',
            total_amount,
            subtotal,
            customer_name: customer_name || 'Walk-in Customer',
            customer_email,
            payment_method,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('id');

        finalOrderId = newOrder.id || newOrder;

        // Insert items into order_items
        const orderItems = items.map((item: any) => ({
          order_id: finalOrderId,
          product_id: item.product_id || null,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || (Number(item.unit_price) * Number(item.quantity)) || 0,
          notes: item.notes || item.description || ''
        }));

        await trx('order_items').insert(orderItems);

        // Insert initial payment record
        await trx('payments').insert({
          order_id: finalOrderId,
          payment_method,
          amount: total_amount,
          status: 'pending'
        });
        
        if (!finalTotalAmount) finalTotalAmount = total_amount;
      } else if (order_id) {
        // Check if order exists
        const order = await trx('orders').where({ id: order_id }).first();
        if (!order) {
          throw new Error('Order not found');
        }

        // Check if invoice already exists for this order
        const existingInvoice = await trx('invoices').where({ order_id }).first();
        if (existingInvoice) {
          return existingInvoice;
        }
        
        if (!finalTotalAmount) finalTotalAmount = order.total_amount;
      } else if (!items || items.length === 0) {
        // Allow creating a manual invoice without items if event_price is provided
        if (!finalTotalAmount) {
          throw new Error('Either order_id, items, or event_price are required');
        }
      }

      const invoice_number = await generateInvoiceNumber();

      const [invoice] = await trx('invoices')
        .insert({
          order_id: finalOrderId,
          invoice_number,
          due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days due
          billing_address,
          notes,
          customer_email,
          customer_name,
          event_type,
          event_price,
          total_amount: finalTotalAmount,
          status: 'unpaid',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Insert into invoice_items if provided
      if (items && items.length > 0) {
        const invoiceItems = items.map((item: any) => ({
          invoice_id: invoice.id,
          description: item.description || item.product_name || 'Item',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || Number(item.price) || 0,
          total_price: Number(item.total_price) || Number(item.price) || (Number(item.unit_price) * Number(item.quantity)) || 0
        }));
        await trx('invoice_items').insert(invoiceItems);
      }

      res.status(201).json(invoice);
    });
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    res.status(err.message === 'Order not found' ? 404 : 500).json({ 
      message: err.message || 'Error creating invoice' 
    });
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
      .select(
        'invoices.*', 
        'orders.order_number', 
        db.raw('COALESCE(invoices.total_amount, orders.total_amount) as total_amount'),
        db.raw('COALESCE(invoices.customer_name, orders.customer_name) as customer_name')
      )
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
      .select(
        'invoices.*', 
        'orders.order_number', 
        db.raw('COALESCE(invoices.total_amount, orders.total_amount) as total_amount'),
        db.raw('COALESCE(invoices.customer_name, orders.customer_name) as customer_name'),
        'orders.subtotal', 'orders.tax_amount', 'orders.service_charge', 'orders.discount_amount', 'orders.customer_phone'
      )
      .leftJoin('orders', 'invoices.order_id', 'orders.id')
      .where('invoices.id', id)
      .first();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Try to get invoice items
    const invoiceItems = await db('invoice_items').where('invoice_id', id);
    
    if (invoiceItems.length > 0) {
      invoice.items = invoiceItems.map(item => ({
        ...item,
        product_name: item.description 
      }));
    } else if (invoice.order_id) {
      // Fallback to order items
      invoice.items = await db('order_items')
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .where('order_id', invoice.order_id)
        .select(
          'order_items.*',
          'products.name as product_name'
        );
    } else {
      invoice.items = [];
    }

    // Get payments
    invoice.payments = invoice.order_id ? await db('payments')
      .where('order_id', invoice.order_id)
      .select('*') : [];

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
      .select(
        'invoices.*', 
        'orders.order_number', 
        db.raw('COALESCE(invoices.total_amount, orders.total_amount) as total_amount'),
        db.raw('COALESCE(invoices.customer_name, orders.customer_name) as customer_name'),
        'orders.subtotal', 'orders.tax_amount', 'orders.service_charge', 'orders.discount_amount', 'orders.customer_phone'
      )
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

    // Get items
    const invoiceItems = await db('invoice_items').where('invoice_id', id);
    if (invoiceItems.length > 0) {
      invoice.items = invoiceItems.map(item => ({ ...item, product_name: item.description }));
    } else if (invoice.order_id) {
      invoice.items = await db('order_items')
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .where('order_id', invoice.order_id)
        .select(
          'order_items.*',
          'products.name as product_name'
        );
    } else {
      invoice.items = [];
    }

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
      .select(
        'invoices.*', 
        'orders.order_number', 
        db.raw('COALESCE(invoices.total_amount, orders.total_amount) as total_amount'),
        db.raw('COALESCE(invoices.customer_name, orders.customer_name) as customer_name'),
        'orders.subtotal', 'orders.tax_amount', 'orders.service_charge', 'orders.discount_amount', 'orders.customer_phone'
      )
      .leftJoin('orders', 'invoices.order_id', 'orders.id')
      .where('invoices.id', id)
      .first();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Get items
    const invoiceItems = await db('invoice_items').where('invoice_id', id);
    if (invoiceItems.length > 0) {
      invoice.items = invoiceItems.map(item => ({ ...item, product_name: item.description }));
    } else if (invoice.order_id) {
      invoice.items = await db('order_items')
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .where('order_id', invoice.order_id)
        .select(
          'order_items.*',
          'products.name as product_name'
        );
    } else {
      invoice.items = [];
    }

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
