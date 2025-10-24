import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticateToken);

// Get inventory (role-based filtering applied in controller)
router.get('/', inventoryController.getInventory);

// Create inventory item (admin, manager, or specific role-based permissions)
router.post('/', 
  authorizeRoles('admin', 'manager', 'kitchen_staff', 'receptionist', 'housekeeping', 'quick_pos', 'waiter'), 
  inventoryController.createInventoryItem
);

// Update inventory item
router.put('/:id', 
  authorizeRoles('admin', 'manager', 'kitchen_staff', 'receptionist', 'housekeeping', 'quick_pos', 'waiter'), 
  inventoryController.updateInventoryItem
);

// Update stock quantity only
router.put('/:id/stock', inventoryController.updateStock);

// Delete inventory item
router.delete('/:id', 
  authorizeRoles('admin', 'manager'), 
  inventoryController.deleteInventoryItem
);

export default router;