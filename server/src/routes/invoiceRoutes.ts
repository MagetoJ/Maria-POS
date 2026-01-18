import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Create invoice (All staff roles)
router.post('/', 
  authorizeRoles('admin', 'manager', 'waiter', 'cashier', 'receptionist', 'bar'),
  invoiceController.createInvoice
);

// Get all invoices (Admin, Manager, Cashier, Receptionist)
router.get('/', 
  authorizeRoles('admin', 'manager', 'cashier', 'receptionist'),
  invoiceController.getInvoices
);

// Get invoice by ID (Admin, Manager, Cashier, Receptionist, Waiter)
router.get('/:id', 
  authorizeRoles('admin', 'manager', 'cashier', 'receptionist', 'waiter', 'bar'),
  invoiceController.getInvoiceById
);

// Update invoice status (Admin only)
router.put('/:id/status', 
  authorizeRoles('admin'),
  invoiceController.updateInvoiceStatus
);

// Email invoice as PDF
router.post('/:id/email',
  authorizeRoles('admin', 'manager', 'cashier', 'receptionist', 'waiter', 'bar'),
  invoiceController.emailInvoice
);

// Download invoice as PDF
router.get('/:id/download',
  authorizeRoles('admin', 'manager', 'cashier', 'receptionist', 'waiter', 'bar'),
  invoiceController.downloadInvoice
);

export default router;
