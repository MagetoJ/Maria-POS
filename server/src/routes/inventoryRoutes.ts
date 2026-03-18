import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticateToken);

// Admin and Manager can perform all actions
router.get('/', authorizeRoles('admin', 'manager', 'accountant', 'receptionist'), inventoryController.getInventoryItems);
router.post('/', authorizeRoles('admin', 'manager'), inventoryController.createInventoryItem);
router.put('/:id', authorizeRoles('admin', 'manager'), inventoryController.updateInventoryItem);
router.delete('/:id', authorizeRoles('admin'), inventoryController.deleteInventoryItem);

// Inventory log access
router.get('/log', authorizeRoles('admin', 'manager', 'accountant'), inventoryController.getInventoryLog);

export default router;
