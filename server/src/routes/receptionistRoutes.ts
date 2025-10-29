import { Router } from 'express';
import * as receptionistController from '../controllers/receptionistController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// PUBLIC ROUTES - No authentication required for Quick POS bar items
// Get bar items formatted as products for Quick POS (including Quick Access mode without authentication)
router.get('/bar-items-as-products',
  receptionistController.getBarItemsAsProducts
);

// All receptionist routes require authentication and specific roles
router.use(authenticateToken);

// Sell bar inventory item - allow receptionist, waiter, quick_pos (per requirements)
router.post('/sell-item', 
  authorizeRoles('receptionist', 'waiter', 'quick_pos', 'admin', 'manager'),
  receptionistController.sellBarItem
);

// Get bar inventory items - allow same roles as sell-item
router.get('/bar-inventory', 
  authorizeRoles('receptionist', 'waiter', 'quick_pos', 'admin', 'manager'),
  receptionistController.getBarInventory
);

// Other routes still require receptionist+ roles
router.use(authorizeRoles('receptionist', 'admin', 'manager'));

// Get sales statistics
router.get('/stats', receptionistController.getSalesStats);

// Get sales history
router.get('/sales-history', receptionistController.getSalesHistory);

export default router;