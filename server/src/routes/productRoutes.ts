import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Public routes (for menu display, etc.)
router.get('/', productController.getProducts);
router.get('/categories', productController.getProductCategories);
router.get('/:id', productController.getProductById);

// Protected routes require authentication and proper roles
router.use(authenticateToken);

// Create new product (admin and manager only)
router.post('/', 
  authorizeRoles('admin', 'manager'), 
  productController.createProduct
);

// Update product (admin and manager only)
router.put('/:id', 
  authorizeRoles('admin', 'manager'), 
  productController.updateProduct
);

// Toggle product availability (admin, manager, kitchen_staff)
router.patch('/:id/toggle-availability', 
  authorizeRoles('admin', 'manager', 'kitchen_staff'), 
  productController.toggleProductAvailability
);

// Delete product (admin only)
router.delete('/:id', 
  authorizeRoles('admin'), 
  productController.deleteProduct
);

export default router;