import { Request, Response } from 'express';
import db from '../db';

// Get all purchase orders
export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status, supplierId, search } = req.query;

    if (search && typeof search === 'string' && search.trim().length > 0) {
      // When searching, we need to find purchase orders that contain items matching the search term
      const searchTerm = `%${search.toLowerCase()}%`;

      const orderIds = await db('purchase_order_items as poi')
        .join('inventory_items as ii', function() {
          this.on('poi.inventory_item_id', '=', 'ii.id')
              .orOn('poi.item_id', '=', 'ii.id');
        })
        .whereRaw('LOWER(ii.name) LIKE ?', [searchTerm])
        .distinct('poi.purchase_order_id')
        .pluck('poi.purchase_order_id');

      let query = db('purchase_orders')
        .join('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
        .select('purchase_orders.*', 'suppliers.name as supplier_name')
        .whereIn('purchase_orders.id', orderIds);

      if (status) {
        query = query.where('purchase_orders.status', status);
      }
      if (supplierId) {
        query = query.where('purchase_orders.supplier_id', supplierId);
      }

      const orders = await query.orderBy('purchase_orders.order_date', 'desc');
      const normalizedOrders = orders.map((order: any) => ({
        ...order,
        po_number: order.po_number || order.order_number,
        order_number: order.order_number || order.po_number,
        supplier: order.supplier || order.supplier_name || null,
        total_amount: Number(order.total_amount ?? 0),
      }));
      res.json(normalizedOrders);
    } else {
      // Original logic when not searching
      let query = db('purchase_orders')
        .join('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
        .select('purchase_orders.*', 'suppliers.name as supplier_name');

      if (status) {
        query = query.where('purchase_orders.status', status);
      }
      if (supplierId) {
        query = query.where('purchase_orders.supplier_id', supplierId);
      }

      const orders = await query.orderBy('purchase_orders.order_date', 'desc');
      const normalizedOrders = orders.map((order: any) => ({
        ...order,
        po_number: order.po_number || order.order_number,
        order_number: order.order_number || order.po_number,
        supplier: order.supplier || order.supplier_name || null,
        total_amount: Number(order.total_amount ?? 0),
      }));
      res.json(normalizedOrders);
    }
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get purchase order by ID with items
export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await db('purchase_orders as po')
      .where('po.id', id)
      .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
      .select('po.*', 's.name as supplier_name')
      .first();

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const rawItems = await db('purchase_order_items as poi')
      .where('poi.purchase_order_id', id)
      .leftJoin('inventory_items as ii', function () {
        this.on('poi.inventory_item_id', '=', 'ii.id');
        this.orOn('poi.item_id', '=', 'ii.id');
      })
      .select('poi.*', 'ii.name as item_name', 'ii.unit as item_unit');

    const items = rawItems.map((item: any) => {
      const quantityOrdered = Number(item.quantity_ordered ?? item.quantity ?? 0);
      const quantityReceived = Number(item.quantity_received ?? item.received_quantity ?? 0);
      const unitCost = Number(item.unit_cost ?? item.unit_price ?? 0);
      const inventoryItemId = item.inventory_item_id ?? item.item_id;
      const totalPrice = Number(
        item.total_price ?? unitCost * quantityOrdered
      );

      return {
        ...item,
        inventory_item_id: inventoryItemId,
        quantity: Number(item.quantity ?? quantityOrdered),
        quantity_ordered: quantityOrdered,
        quantity_received: quantityReceived,
        received_quantity: Number(item.received_quantity ?? quantityReceived),
        unit_cost: unitCost,
        unit_price: Number(item.unit_price ?? unitCost),
        total_price: totalPrice,
        unit: item.unit ?? item.item_unit,
      };
    });

    const normalizedOrder = {
      ...order,
      po_number: order.po_number || order.order_number,
      order_number: order.order_number || order.po_number,
      supplier: order.supplier || order.supplier_name || null,
      total_amount: Number(order.total_amount ?? 0),
    };

    res.json({ ...normalizedOrder, items });
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create purchase order
export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const {
      supplier_id,
      order_date,
      expected_delivery_date,
      items,
      notes,
    } = req.body;
    const userId = (req as any).user?.id;

    if (!supplier_id || !order_date || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const supplierRecord = await db('suppliers').where('id', supplier_id).select('name').first();
    if (!supplierRecord) {
      return res.status(400).json({ message: 'Invalid supplier' });
    }

    // Generate PO number
    const lastPO = await db('purchase_orders')
      .select('po_number')
      .orderBy('id', 'desc')
      .limit(1)
      .first();

    const nextNumber = lastPO
      ? parseInt(lastPO.po_number.replace('PO', '')) + 1
      : 1001;
    const po_number = `PO${nextNumber}`;

    const normalizedItems = items.map((item: any) => {
      const inventoryItemId = Number(item.inventory_item_id);
      const quantityOrdered = Number(item.quantity_ordered);
      const unitCost = Number(item.unit_cost);
      const quantityReceived = Number(item.quantity_received ?? 0);

      if (
        Number.isNaN(inventoryItemId) ||
        Number.isNaN(quantityOrdered) ||
        Number.isNaN(unitCost)
      ) {
        throw new Error('Invalid item data');
      }

      return {
        inventory_item_id: inventoryItemId,
        quantity_ordered: quantityOrdered,
        unit_cost: unitCost,
        quantity_received: quantityReceived,
      };
    });

    const totalAmount = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.unit_cost * item.quantity_ordered,
      0
    );

    const [hasOrderNumberColumn, hasSupplierColumn, hasItemIdColumn, hasInventoryItemIdColumn, hasQuantityColumn, hasQuantityOrderedColumn, hasUnitPriceColumn, hasUnitCostColumn, hasTotalPriceColumn, hasReceivedQuantityColumn, hasQuantityReceivedColumn] = await Promise.all([
      db.schema.hasColumn('purchase_orders', 'order_number'),
      db.schema.hasColumn('purchase_orders', 'supplier'),
      db.schema.hasColumn('purchase_order_items', 'item_id'),
      db.schema.hasColumn('purchase_order_items', 'inventory_item_id'),
      db.schema.hasColumn('purchase_order_items', 'quantity'),
      db.schema.hasColumn('purchase_order_items', 'quantity_ordered'),
      db.schema.hasColumn('purchase_order_items', 'unit_price'),
      db.schema.hasColumn('purchase_order_items', 'unit_cost'),
      db.schema.hasColumn('purchase_order_items', 'total_price'),
      db.schema.hasColumn('purchase_order_items', 'received_quantity'),
      db.schema.hasColumn('purchase_order_items', 'quantity_received'),
    ]);

    const insertData: Record<string, unknown> = {
      po_number,
      supplier_id,
      order_date,
      expected_delivery_date: expected_delivery_date || null,
      total_amount: totalAmount,
      notes: notes || null,
      created_by: userId,
    };

    if (hasOrderNumberColumn) {
      insertData.order_number = po_number;
    }

    if (hasSupplierColumn) {
      insertData.supplier = supplierRecord.name;
    }

    const result = await db('purchase_orders').insert(insertData).returning('id');
    const orderIdRaw = Array.isArray(result)
      ? typeof result[0] === 'object'
        ? (result[0] as any).id
        : result[0]
      : result;
    const orderId = Number(orderIdRaw);
    if (Number.isNaN(orderId)) {
      throw new Error('Failed to create purchase order');
    }

    for (const item of normalizedItems) {
      const totalPrice = item.unit_cost * item.quantity_ordered;
      const itemInsert: Record<string, unknown> = {
        purchase_order_id: orderId,
      };

      if (hasInventoryItemIdColumn) {
        itemInsert.inventory_item_id = item.inventory_item_id;
      }

      if (hasItemIdColumn) {
        itemInsert.item_id = item.inventory_item_id;
      }

      if (hasQuantityOrderedColumn) {
        itemInsert.quantity_ordered = item.quantity_ordered;
      }

      if (hasQuantityColumn) {
        itemInsert.quantity = item.quantity_ordered;
      }

      if (hasUnitCostColumn) {
        itemInsert.unit_cost = item.unit_cost;
      }

      if (hasUnitPriceColumn) {
        itemInsert.unit_price = item.unit_cost;
      }

      if (hasTotalPriceColumn) {
        itemInsert.total_price = totalPrice;
      }

      if (hasQuantityReceivedColumn) {
        itemInsert.quantity_received = item.quantity_received;
      }

      if (hasReceivedQuantityColumn) {
        itemInsert.received_quantity = item.quantity_received;
      }

      await db('purchase_order_items').insert(itemInsert);
    }

    res.status(201).json({
      id: orderId,
      po_number,
      message: 'Purchase order created successfully',
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Receive purchase order items
export const receivePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, received_date } = req.body;
    const userId = (req as any).user?.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    const [hasQuantityReceivedColumn, hasReceivedQuantityColumn, hasTotalPriceColumn, hasItemUpdatedAtColumn, hasOrderReceivedByColumn] = await Promise.all([
      db.schema.hasColumn('purchase_order_items', 'quantity_received'),
      db.schema.hasColumn('purchase_order_items', 'received_quantity'),
      db.schema.hasColumn('purchase_order_items', 'total_price'),
      db.schema.hasColumn('purchase_order_items', 'updated_at'),
      db.schema.hasColumn('purchase_orders', 'received_by'),
    ]);

    const deliveryDate = received_date ? new Date(received_date) : new Date();
    const now = new Date();

    try {
      await db.transaction(async (trx) => {
        const order = await trx('purchase_orders').where('id', id).forUpdate().first();
        if (!order) {
          throw new Error('PO_NOT_FOUND');
        }

        const existingItems = await trx('purchase_order_items').where('purchase_order_id', id);
        if (existingItems.length === 0) {
          throw new Error('PO_ITEMS_NOT_FOUND');
        }

        const itemsById = new Map<number, any>();
        for (const record of existingItems) {
          itemsById.set(Number(record.id), record);
        }

        const inventoryPresence = new Map<number, boolean>();

        for (const rawItem of items) {
          const itemId = Number(rawItem.id);
          const targetReceived = Number(rawItem.quantity_received);

          if (!Number.isFinite(itemId) || !Number.isFinite(targetReceived)) {
            continue;
          }

          const orderItem = itemsById.get(itemId);
          if (!orderItem) {
            continue;
          }

          const previousReceived = Number(orderItem.quantity_received ?? orderItem.received_quantity ?? 0);
          const orderedQuantity = Number(orderItem.quantity_ordered ?? orderItem.quantity ?? 0);
          const upperBound = orderedQuantity > 0 ? orderedQuantity : targetReceived;
          const clampedReceived = Math.max(0, Math.min(targetReceived, upperBound));

          const updatePayload: Record<string, unknown> = {};
          if (hasQuantityReceivedColumn) {
            updatePayload.quantity_received = clampedReceived;
          }
          if (hasReceivedQuantityColumn) {
            updatePayload.received_quantity = clampedReceived;
          }
          if (hasTotalPriceColumn) {
            const unitPriceValue = Number(orderItem.unit_cost ?? orderItem.unit_price ?? 0);
            const baseQuantity = Number(orderItem.quantity ?? orderItem.quantity_ordered ?? clampedReceived);
            updatePayload.total_price = unitPriceValue * baseQuantity;
          }
          if (hasItemUpdatedAtColumn) {
            updatePayload.updated_at = now;
          }

          if (Object.keys(updatePayload).length > 0) {
            await trx('purchase_order_items').where('id', itemId).update(updatePayload);
          }

          const quantityToAdd = clampedReceived - previousReceived;
          if (quantityToAdd > 0) {
            const inventoryId = Number(orderItem.inventory_item_id ?? orderItem.item_id);
            if (Number.isFinite(inventoryId)) {
              let hasInventoryItem = inventoryPresence.get(inventoryId);
              if (hasInventoryItem === undefined) {
                const inventoryRow = await trx('inventory_items').where('id', inventoryId).select('id').first();
                hasInventoryItem = !!inventoryRow;
                inventoryPresence.set(inventoryId, hasInventoryItem);
              }

              if (hasInventoryItem) {
                await trx('inventory_items').where('id', inventoryId).increment('current_stock', quantityToAdd);

                await trx('inventory_log')
                  .insert({
                    inventory_item_id: inventoryId,
                    action: 'purchase_received',
                    quantity_change: quantityToAdd,
                    reference_id: id,
                    reference_type: 'purchase_order',
                    logged_by: userId ?? null,
                    notes: `Received from PO ${order.po_number || order.order_number || order.id}`,
                    created_at: now,
                  })
                  .catch(() => {});
              }
            }
          }
        }

        const refreshedItems = await trx('purchase_order_items').where('purchase_order_id', id);
        const allReceived = refreshedItems.every((item: any) => {
          const orderedQuantity = Number(item.quantity_ordered ?? item.quantity ?? 0);
          if (!Number.isFinite(orderedQuantity) || orderedQuantity <= 0) {
            return true;
          }
          const receivedQuantity = Number(item.quantity_received ?? item.received_quantity ?? 0);
          return receivedQuantity >= orderedQuantity;
        });

        const totalAmount = refreshedItems.reduce((sum: number, item: any) => {
          const unitPriceValue = Number(item.unit_cost ?? item.unit_price ?? 0);
          const quantityValue = Number(item.quantity ?? item.quantity_ordered ?? 0);
          if (!Number.isFinite(unitPriceValue) || !Number.isFinite(quantityValue)) {
            return sum;
          }
          return sum + unitPriceValue * quantityValue;
        }, 0);

        const orderUpdate: Record<string, unknown> = {
          status: allReceived ? 'received' : 'partially_received',
          actual_delivery_date: deliveryDate,
          updated_at: now,
          total_amount: totalAmount,
        };

        if (hasOrderReceivedByColumn && userId) {
          orderUpdate.received_by = userId;
        }

        await trx('purchase_orders').where('id', id).update(orderUpdate);
      });

      res.json({
        message: 'Purchase order processed successfully',
      });
    } catch (error) {
      console.error('Receive purchase order error:', error);
      if ((error as Error).message === 'PO_NOT_FOUND') {
        return res.status(404).json({ message: 'Purchase order not found' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Receive purchase order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel purchase order
export const cancelPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await db('purchase_orders').where('id', id).first();
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status === 'received') {
      return res.status(400).json({ message: 'Cannot cancel a received purchase order' });
    }

    await db('purchase_orders').where('id', id).update({
      status: 'cancelled',
      updated_at: new Date(),
    });

    res.json({ message: 'Purchase order cancelled successfully' });
  } catch (error) {
    console.error('Cancel purchase order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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