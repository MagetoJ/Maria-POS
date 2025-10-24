import { Router } from 'express';
import * as receptionistController from '../controllers/receptionistController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All receptionist routes require authentication and specific roles
router.use(authenticateToken);

// Sell bar inventory item - allow receptionist, waiter, quick_pos (per requirements)
router.post('/sell-item', 
  authorizeRoles('receptionist', 'waiter', 'quick_pos', 'admin', 'manager'),
  receptionistController.sellBarItem
);

// Other routes still require receptionist+ roles
router.use(authorizeRoles('receptionist', 'admin', 'manager'));

// Get bar inventory items
router.get('/bar-inventory', receptionistController.getBarInventory);

// Get sales statistics
router.get('/stats', receptionistController.getSalesStats);

// Get sales history
router.get('/sales-history', receptionistController.getSalesHistory);

export default router;