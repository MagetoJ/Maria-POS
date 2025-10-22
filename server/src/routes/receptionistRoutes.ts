import { Router } from 'express';
import * as receptionistController from '../controllers/receptionistController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All receptionist routes require authentication and specific roles
router.use(authenticateToken);
router.use(authorizeRoles('receptionist', 'admin', 'manager'));

// Sell bar inventory item
router.post('/sell-item', receptionistController.sellBarItem);

// Get bar inventory items
router.get('/bar-inventory', receptionistController.getBarInventory);

// Get sales statistics
router.get('/stats', receptionistController.getSalesStats);

// Get sales history
router.get('/sales-history', receptionistController.getSalesHistory);

export default router;