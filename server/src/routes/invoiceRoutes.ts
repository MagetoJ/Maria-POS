import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Create invoice (Admin and Manager)
router.post('/', 
  authorizeRoles('admin', 'manager'),
  invoiceController.createInvoice
);

// Get all invoices (Admin and Manager)
router.get('/', 
  authorizeRoles('admin', 'manager'),
  invoiceController.getInvoices
);

// Get invoice by ID (Admin and Manager)
router.get('/:id', 
  authorizeRoles('admin', 'manager'),
  invoiceController.getInvoiceById
);

// Update invoice status (Admin only)
router.put('/:id/status', 
  authorizeRoles('admin'),
  invoiceController.updateInvoiceStatus
);

// Email invoice as PDF (Admin and Manager)
router.post('/:id/email',
  authorizeRoles('admin', 'manager'),
  invoiceController.emailInvoice
);

// Download invoice as PDF (Admin and Manager)
router.get('/:id/download',
  authorizeRoles('admin', 'manager'),
  invoiceController.downloadInvoice
);

export default router;
