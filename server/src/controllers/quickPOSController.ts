import { Request, Response } from 'express';
import db from '../db';

// Sell bar inventory item
export const sellBarItem = async (req: Request, res: Response) => {
  const { inventory_item_id, quantity, unit_price, payment_method } = req.body;
  const staff_id = req.user?.id || null;

  if (!inventory_item_id || !quantity || !unit_price || !payment_method) {
    return res.status(400).json({
      message: 'Item ID, quantity, price, and payment method are required.'
    });
  }

  try {
    const item = await db('inventory_items')
      .where({ id: inventory_item_id, inventory_type: 'bar' })
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Bar inventory item not found.' });
    }

    if (item.current_stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available.' });
    }

    const newStock = item.current_stock - quantity;
    const total_amount = quantity * unit_price;
    const order_number = `BAR-${Date.now()}`;

    await db.transaction(async (trx) => {
      // Update inventory stock
      await trx('inventory_items')
        .where({ id: inventory_item_id })
        .update({
          current_stock: newStock
        });

      // Create order record
      const [order] = await trx('orders').insert({
        order_number,
        order_type: 'bar_sale',
        status: 'completed',
        staff_id,
        total_amount,
        payment_status: 'paid'
      }).returning('id');

      // Create payment record
      await trx('payments').insert({
        order_id: order.id || order,
        payment_method,
        amount: total_amount,
        status: 'completed'
      });

      // Create order item record
      await trx('order_items').insert({
        order_id: order.id || order,
        product_id: inventory_item_id, // Using inventory_item_id as product_id for bar items
        quantity,
        unit_price,
        total_price: total_amount,
      });
    });

    res.json({
      message: 'Bar item sold successfully.',
      order_number,
      total_amount
    });
  } catch (error) {
    console.error('Sell bar item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get bar items formatted as products for Quick POS
export const getBarItemsAsProducts = async (req: Request, res: Response) => {
  try {
    const barItems = await db('inventory_items')
      .where({ inventory_type: 'bar', is_active: true })
      .select('*')
      .orderBy('name', 'asc');

    // Format inventory items as Product interface compatible items
    const formattedItems = barItems.map(item => ({
      id: item.id,
      category_id: 0, // Bar items are in category 0 (special category for bar)
      name: item.name,
      description: item.description || '',
      price: item.cost_per_unit || 0, // Use cost_per_unit as price for bar items
      is_available: item.current_stock > 0,
      image_url: item.image_url || null,
      preparation_time: 0, // Bar items don't have preparation time
      current_stock: item.current_stock,
      unit: item.unit,
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Get bar items as products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};