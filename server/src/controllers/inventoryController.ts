import { Request, Response } from 'express';
import db from '../db';

// Get all inventory items
export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let query = db('inventory_items').where('is_active', true).orderBy('name', 'asc');

    if (type && type !== 'all') {
      query = query.where('inventory_type', type as string);
    }

    const items = await query;
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new inventory item
export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const {
      name,
      unit,
      current_stock,
      minimum_stock,
      cost_per_unit,
      selling_price,
      supplier,
      inventory_type,
      image_url
    } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ message: 'Name and unit are required' });
    }

    const [newItem] = await db('inventory_items')
      .insert({
        name,
        unit,
        current_stock: current_stock || 0,
        minimum_stock: minimum_stock || 0,
        cost_per_unit: cost_per_unit || 0,
        selling_price: selling_price || 0,
        supplier: supplier || '',
        inventory_type: inventory_type || 'kitchen',
        image_url: image_url || null,
        is_active: true
      })
      .returning('*');

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update inventory item
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await db('inventory_items').where({ id }).first();
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const [updatedItem] = await db('inventory_items')
      .where({ id })
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete inventory item (soft delete)
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await db('inventory_items').where({ id }).first();
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await db('inventory_items')
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date()
      });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get inventory log
export const getInventoryLog = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await db('inventory_log as il')
      .join('inventory_items as ii', 'il.inventory_item_id', 'ii.id')
      .leftJoin('staff as s', 'il.logged_by', 's.id')
      .select(
        'il.*',
        'ii.name as item_name',
        's.name as staff_name'
      )
      .orderBy('il.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching inventory log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
