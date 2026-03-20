import { Request, Response } from 'express';
import db from '../db';

// Get all product returns
export const getProductReturns = async (req: Request, res: Response) => {
  try {
    const returns = await db('product_returns')
      .leftJoin('products', 'product_returns.product_id', 'products.id')
      .leftJoin('inventory_items', 'product_returns.inventory_id', 'inventory_items.id')
      .leftJoin('staff', 'product_returns.created_by', 'staff.id')
      .select(
        'product_returns.*',
        'products.name as product_name',
        'inventory_items.name as inventory_name',
        'inventory_items.unit as inventory_unit',
        'staff.name as created_by_name'
      )
      .orderBy('product_returns.created_at', 'desc');

    res.json(returns);
  } catch (error) {
    console.error('Get product returns error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get product return by ID
export const getProductReturnById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productReturn = await db('product_returns')
      .where('product_returns.id', id)
      .leftJoin('products', 'product_returns.product_id', 'products.id')
      .leftJoin('inventory_items', 'product_returns.inventory_id', 'inventory_items.id')
      .leftJoin('staff', 'product_returns.created_by', 'staff.id')
      .select(
        'product_returns.*',
        'products.name as product_name',
        'inventory_items.name as inventory_name',
        'inventory_items.unit as inventory_unit',
        'staff.name as created_by_name'
      )
      .first();

    if (!productReturn) {
      return res.status(404).json({ message: 'Product return not found' });
    }

    res.json(productReturn);
  } catch (error) {
    console.error('Get product return error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create product return
export const createProductReturn = async (req: Request, res: Response) => {
  try {
    const { order_id, product_id, inventory_id, quantity_returned, reason, refund_amount, notes } = req.body;
    const user = (req as any).user;
    const userId = user?.id;
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    // Require either product_id or inventory_id
    if (!quantity_returned || !reason) {
      return res.status(400).json({ message: 'Missing required fields: quantity_returned, reason' });
    }

    if (!product_id && !inventory_id) {
      return res.status(400).json({ message: 'Either product_id or inventory_id must be provided' });
    }

    // Validate product exists if provided
    if (product_id) {
      const product = await db('products').where('id', product_id).first();
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }

    // Validate inventory item exists if provided
    if (inventory_id) {
      const inventoryItem = await db('inventory_items').where('id', inventory_id).first();
      if (!inventoryItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
    }

    // Verify order exists if order_id is provided
    if (order_id) {
      const order = await db('orders').where('id', order_id).first();
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
    }

    // Calculate refund amount
    let finalRefundAmount = refund_amount;
    if (!finalRefundAmount && product_id) {
      const product = await db('products').where('id', product_id).first();
      finalRefundAmount = product.price * quantity_returned;
    }

    // Determine initial status - Admins/Managers are auto-approved
    const initialStatus = isAdmin ? 'approved' : 'pending';

    const id = await db('product_returns').insert({
      order_id: order_id || null,
      product_id: product_id || null,
      inventory_id: inventory_id || null,
      quantity_returned: parseInt(quantity_returned),
      reason,
      refund_amount: finalRefundAmount ? parseFloat(finalRefundAmount) : null,
      notes: notes || null,
      created_by: userId,
      status: initialStatus,
      approved_by: isAdmin ? userId : null,
      approved_at: isAdmin ? new Date() : null,
    });

    const returnId = id[0];

    // ONLY update inventory if approved immediately (Admin/Manager)
    if (initialStatus === 'approved' && inventory_id) {
      await db('inventory_items')
        .where('id', inventory_id)
        .increment('current_stock', parseInt(quantity_returned));
    }

    // Log to audit table
    await logAudit(
      'product_return',
      returnId,
      'create',
      null,
      {
        order_id,
        product_id,
        inventory_id,
        quantity_returned,
        reason,
        refund_amount: finalRefundAmount,
        status: initialStatus
      },
      userId
    );

    res.status(201).json({
      id: returnId,
      status: initialStatus,
      message: initialStatus === 'approved' 
        ? 'Product return created and processed successfully' 
        : 'Product return request submitted for Admin approval',
    });
  } catch (error) {
    console.error('Create product return error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve product return (Admin/Manager only)
export const approveProductReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const productReturn = await db('product_returns').where('id', id).first();
    if (!productReturn) {
      return res.status(404).json({ message: 'Product return not found' });
    }

    if (productReturn.status !== 'pending') {
      return res.status(400).json({ message: `Return is already ${productReturn.status}` });
    }

    await db.transaction(async (trx) => {
      // 1. Update return status
      await trx('product_returns')
        .where('id', id)
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date(),
          updated_at: new Date()
        });

      // 2. Update inventory if applicable
      if (productReturn.inventory_id) {
        await trx('inventory_items')
          .where('id', productReturn.inventory_id)
          .increment('current_stock', productReturn.quantity_returned);
      }
    });

    // Log to audit table
    await logAudit('product_return', parseInt(id), 'approve', productReturn, { status: 'approved' }, adminId);

    res.json({ message: 'Product return approved and inventory updated' });
  } catch (error) {
    console.error('Approve product return error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Deny product return (Admin/Manager only)
export const denyProductReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;
    const { notes } = req.body;

    const productReturn = await db('product_returns').where('id', id).first();
    if (!productReturn) {
      return res.status(404).json({ message: 'Product return not found' });
    }

    if (productReturn.status !== 'pending') {
      return res.status(400).json({ message: `Return is already ${productReturn.status}` });
    }

    await db('product_returns')
      .where('id', id)
      .update({
        status: 'denied',
        approved_by: adminId,
        approved_at: new Date(),
        notes: notes ? `${productReturn.notes || ''}\nDenial reason: ${notes}` : productReturn.notes,
        updated_at: new Date()
      });

    // Log to audit table
    await logAudit('product_return', parseInt(id), 'deny', productReturn, { status: 'denied' }, adminId);

    res.json({ message: 'Product return denied' });
  } catch (error) {
    console.error('Deny product return error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update product return
export const updateProductReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const updateData = req.body;

    const existing = await db('product_returns').where('id', id).first();
    if (!existing) {
      return res.status(404).json({ message: 'Product return not found' });
    }

    await db('product_returns').where('id', id).update({
      ...updateData,
      quantity_returned: updateData.quantity_returned
        ? parseInt(updateData.quantity_returned)
        : undefined,
      refund_amount: updateData.refund_amount
        ? parseFloat(updateData.refund_amount)
        : undefined,
      updated_at: new Date(),
    });

    // Log to audit table
    await logAudit('product_return', parseInt(id), 'update', existing, updateData, userId);

    res.json({ message: 'Product return updated successfully' });
  } catch (error) {
    console.error('Update product return error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete product return
export const deleteProductReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const existing = await db('product_returns').where('id', id).first();
    if (!existing) {
      return res.status(404).json({ message: 'Product return not found' });
    }

    // Reverse the inventory adjustment
    if (existing.inventory_id) {
      await db('inventory_items')
        .where('id', existing.inventory_id)
        .decrement('current_stock', existing.quantity_returned);
    }

    await db('product_returns').where('id', id).del();

    // Log to audit table
    await logAudit('product_return', parseInt(id), 'delete', existing, null, userId);

    res.json({ message: 'Product return deleted successfully and inventory reversed' });
  } catch (error) {
    console.error('Delete product return error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get returns summary (for dashboard)
export const getReturnsSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let query = db('product_returns').select('reason').count('id as count').groupBy('reason');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const summary = await query;
    const totalReturns = await db('product_returns')
      .sum('refund_amount as total')
      .where((q) => {
        if (startDate) q.where('created_at', '>=', startDate);
        if (endDate) q.where('created_at', '<=', endDate);
      })
      .first();

    res.json({
      byReason: summary,
      totalReturnValue: totalReturns?.total || 0,
    });
  } catch (error) {
    console.error('Get returns summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get inventory items for returns dropdown
export const getInventoryForReturns = async (req: Request, res: Response) => {
  try {
    const inventoryItems = await db('inventory_items')
      .select('id', 'name', 'unit', 'current_stock')
      .where('is_active', true)
      .orderBy('name', 'asc');

    res.json(inventoryItems);
  } catch (error) {
    console.error('Get inventory for returns error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get products for returns dropdown (legacy - kept for backwards compatibility)
export const getProductsForReturns = async (req: Request, res: Response) => {
  try {
    const products = await db('products')
      .select('id', 'name', 'price')
      .where('is_active', true)
      .orderBy('name', 'asc');

    res.json(products);
  } catch (error) {
    console.error('Get products for returns error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to log to audit table
async function logAudit(
  entityType: string,
  entityId: number,
  action: string,
  oldValues: any,
  newValues: any,
  userId: number | undefined
) {
  try {
    await db('audit_logs').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      changed_by: userId || null,
      ip_address: null,
      user_agent: null,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}