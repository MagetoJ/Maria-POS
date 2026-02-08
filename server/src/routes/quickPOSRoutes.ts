import { Router } from 'express';
import * as quickPOSController from '../controllers/quickPOSController';
import * as invoiceController from '../controllers/invoiceController'; // Import the invoice controller

const router = Router();

// PUBLIC ROUTES - No authentication required for Quick POS
// Search products and inventory items for Quick POS (accessible without authentication)
router.get('/search',
  quickPOSController.searchProductsAndInventory
);

// Get bar items formatted as products for Quick POS (accessible without authentication)
router.get('/bar-items-as-products',
  quickPOSController.getBarItemsAsProducts
);

// Sell bar inventory item - public access (no authentication required)
router.post('/sell-item',
  quickPOSController.sellBarItem
);

// Get recent orders for Quick POS (accessible without authentication)
router.get('/recent-orders',
  quickPOSController.getRecentOrders
);

// NEW: Invoicing routes for Quick POS (no admin restriction)
router.post('/create-invoice', invoiceController.createInvoice);
router.get('/download-invoice/:id', invoiceController.downloadInvoice);

// Generate quick invoice for an order
router.post('/generate-invoice',
  quickPOSController.generateQuickInvoice
);

export default router;