import { Router } from 'express';
import * as purchaseOrdersController from '../controllers/purchaseOrdersController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// PUBLIC ROUTES - No authentication required for Quick POS bar sales
// Get bar items formatted as products for Quick POS (accessible without authentication)
router.get('/bar-items-as-products',
  purchaseOrdersController.getBarItemsAsProducts
);

// Sell bar inventory item - public access (no authentication required)
router.post('/sell-item',
  purchaseOrdersController.sellBarItem
);

// All purchase order routes are now public

// Get all purchase orders with optional filtering
router.get('/', purchaseOrdersController.getPurchaseOrders);

// Get purchase order by ID with items
router.get('/:id', purchaseOrdersController.getPurchaseOrderById);

// Create purchase order
router.post('/', purchaseOrdersController.createPurchaseOrder);

// Receive purchase order items
router.post('/:id/receive', purchaseOrdersController.receivePurchaseOrder);

// Cancel purchase order
router.patch('/:id/cancel', purchaseOrdersController.cancelPurchaseOrder);

export default router;