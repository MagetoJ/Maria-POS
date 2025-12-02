import { Request, Response } from 'express';
import db from '../db';
import fs from 'fs';
import csv from 'csv-parser';

// Get inventory items based on user role
export const getInventory = async (req: Request, res: Response) => {
  try {
    const {
      inventory_type,
      low_stock,
      search
    } = req.query;

    const userRole = req.user?.role;

    const [hasSupplierIdColumn, hasSupplierColumn, hasProductIdColumn] = await Promise.all([
      db.schema.hasColumn('inventory_items', 'supplier_id'),
      db.schema.hasColumn('inventory_items', 'supplier'),
      db.schema.hasColumn('inventory_items', 'product_id')
    ]);

    let query = db('inventory_items');

    if (hasSupplierIdColumn) {
      query = query.leftJoin('suppliers', 'inventory_items.supplier_id', 'suppliers.id');
    }

    if (hasProductIdColumn) {
      query = query.leftJoin('products', 'inventory_items.product_id', 'products.id');
    }

    const selectFields = ['inventory_items.*'];

    if (hasSupplierIdColumn) {
      selectFields.push('suppliers.name as supplier_name');
    } else if (hasSupplierColumn) {
      selectFields.push('inventory_items.supplier as supplier_name');
    }

    if (hasProductIdColumn) {
      selectFields.push('products.name as product_name');
    }

    query = query.select(selectFields).orderBy('inventory_items.name', 'asc');

    if (!userRole) {
      return res.status(403).json({ message: 'User role not found' });
    }

    // Apply role-based filtering
    if (userRole === 'kitchen_staff') {
      query.where('inventory_items.inventory_type', 'kitchen');
    } else if (userRole === 'receptionist') {
      query.whereIn('inventory_items.inventory_type', ['bar', 'housekeeping', 'minibar']);
    } else if (userRole === 'waiter' || userRole === 'quick_pos') {
      query.where('inventory_items.inventory_type', 'bar');
    } else if (!['admin', 'manager'].includes(userRole)) {
      return res.json([]); // Return empty for other non-privileged roles
    }

    if (inventory_type) {
      query = query.where('inventory_items.inventory_type', inventory_type as string);
    }

    if (low_stock === 'true') {
      query = query.whereRaw('inventory_items.current_stock <= inventory_items.low_stock_threshold');
    }

    // Add search logic
    if (search) {
      const searchTerm = search as string;
      query = query.where('inventory_items.name', 'ilike', `%${searchTerm}%`);
    }

    const inventory = await query;
    res.json(inventory);

  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ 
      message: 'Error fetching inventory', 
      error: (err as Error).message 
    });
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
      supplier,
      inventory_type
    } = req.body;

    // Validation
    if (!name || !unit || !supplier) {
      return res.status(400).json({ 
        message: 'Name, unit, and supplier are required' 
      });
    }

    // Check user permissions
    const userRole = req.user?.role;
    const allowedTypes = getAllowedInventoryTypes(userRole);
    
    if (!allowedTypes.includes(inventory_type)) {
      return res.status(403).json({ 
        message: 'You do not have permission to create this type of inventory item' 
      });
    }

    const [newItem] = await db('inventory_items')
      .insert({
        name,
        unit,
        current_stock: current_stock || 0,
        minimum_stock: minimum_stock || 0,
        cost_per_unit: cost_per_unit || 0,
        supplier,
        inventory_type,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    res.status(201).json(newItem);

  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ 
      message: 'Error creating inventory item' 
    });
  }
};

// Update inventory item
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };

    // Check if item exists
    const existingItem = await db('inventory_items').where({ id }).first();
    if (!existingItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check user permissions
    const userRole = req.user?.role;
    const allowedTypes = getAllowedInventoryTypes(userRole);
    
    if (!allowedTypes.includes(existingItem.inventory_type)) {
      return res.status(403).json({ 
        message: 'You do not have permission to update this inventory item' 
      });
    }

    const [updatedItem] = await db('inventory_items')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json(updatedItem);

  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ 
      message: 'Error updating inventory item' 
    });
  }
};

// Update stock quantity only
export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current_stock } = req.body;
    const userRole = req.user?.role;

    if (current_stock === undefined) {
      return res.status(400).json({ message: 'Current stock value is required' });
    }

    const inventoryItem = await db('inventory_items').where({ id }).first();
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check permissions
    const isAdminOrManager = ['admin', 'manager'].includes(userRole!);
    const isKitchenStaff = userRole === 'kitchen_staff' && inventoryItem.inventory_type === 'kitchen';
    const isReceptionist = userRole === 'receptionist' && 
      ['bar', 'housekeeping', 'minibar'].includes(inventoryItem.inventory_type);

    if (!isAdminOrManager && !isKitchenStaff && !isReceptionist) {
      return res.status(403).json({ 
        message: `You do not have permission to update ${inventoryItem.inventory_type} items.` 
      });
    }

    const [updatedItem] = await db('inventory_items')
      .where({ id })
      .update({ 
        current_stock: Math.max(0, current_stock), 
        updated_at: new Date() 
      })
      .returning('*');

    res.json(updatedItem);
  } catch (err) {
    console.error('Inventory stock update error:', err);
    res.status(500).json({ message: 'Error updating inventory stock' });
  }
};

// Upload and process inventory CSV
export const uploadInventory = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const results: any[] = [];
  const errors: string[] = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          await db.transaction(async (trx) => {
            for (const row of results) {
              const name = row['Name'] || row['name'];
              const quantity = parseInt(row['Quantity'] || row['quantity'] || '0');
              const cost = parseFloat(row['Cost'] || row['cost'] || '0');
              const unit = row['Unit'] || row['unit'];
              const supplier = row['Supplier'] || row['supplier'];
              const type = row['Type'] || row['type'] || 'kitchen';

              if (!name) continue;

              const existingItem = await trx('inventory_items')
                .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
                .first();

              if (existingItem) {
                const newStock = existingItem.current_stock + quantity;
                await trx('inventory_items')
                  .where({ id: existingItem.id })
                  .update({
                    current_stock: newStock,
                    cost_per_unit: cost > 0 ? cost : existingItem.cost_per_unit,
                    updated_at: new Date()
                  });
              } else {
                if (!unit || !supplier) {
                  errors.push(`Skipped "${name}": Missing Unit or Supplier for new item.`);
                  continue;
                }

                await trx('inventory_items').insert({
                  name,
                  unit,
                  current_stock: quantity,
                  minimum_stock: 5,
                  cost_per_unit: cost,
                  supplier,
                  inventory_type: type.toLowerCase(),
                  is_active: true,
                  created_at: new Date(),
                  updated_at: new Date()
                });
              }
            }
          });

          fs.unlinkSync(filePath);

          res.json({
            message: 'Inventory processed successfully',
            processed_count: results.length,
            errors: errors.length > 0 ? errors : undefined
          });

        } catch (dbError) {
          console.error('Database transaction error:', dbError);
          res.status(500).json({ message: 'Database error during processing' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({ message: 'Error parsing CSV file' });
      });

  } catch (err) {
    console.error('File processing error:', err);
    res.status(500).json({ message: 'Error processing file' });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const existingItem = await db('inventory_items').where({ id }).first();
    if (!existingItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check user permissions
    const userRole = req.user?.role;
    const allowedTypes = getAllowedInventoryTypes(userRole);
    
    if (!allowedTypes.includes(existingItem.inventory_type)) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this inventory item' 
      });
    }

    await db('inventory_items').where({ id }).del();
    res.json({ message: 'Inventory item deleted successfully' });

  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ 
      message: 'Error deleting inventory item' 
    });
  }
};

// Helper function to get allowed inventory types based on user role
function getAllowedInventoryTypes(role?: string): string[] {
  switch (role) {
    case 'kitchen':
    case 'kitchen_staff':
      return ['kitchen'];
    case 'receptionist':
      return ['housekeeping', 'minibar']; // Removed 'bar' - receptionist can't update bar items
    case 'housekeeping':
      return ['housekeeping', 'minibar']; // Like receptionist but for household items
    case 'quick_pos':
    case 'waiter':
      return ['bar']; // Can sell bar items
    case 'admin':
    case 'manager':
      return ['kitchen', 'bar', 'housekeeping', 'minibar'];
    default:
      return [];
  }
}