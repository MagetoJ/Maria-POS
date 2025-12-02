import { Router } from 'express';
import multer from 'multer';
import * as inventoryController from '../controllers/inventoryController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('csv') || file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const router = Router();

// All inventory routes require authentication
router.use(authenticateToken);

// Get inventory (role-based filtering applied in controller)
router.get('/', inventoryController.getInventory);

// Upload CSV for bulk inventory update
router.post('/upload',
  authorizeRoles('admin', 'manager'),
  upload.single('file'),
  inventoryController.uploadInventory
);

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