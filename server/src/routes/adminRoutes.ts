import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Routes for admin, manager, accountant
router.get('/active-users', authorizeRoles('admin', 'manager', 'accountant'), adminController.getActiveUsers);
router.get('/user-sessions', authorizeRoles('admin', 'manager', 'accountant'), adminController.getUserSessions);
router.get('/low-stock-alerts', authorizeRoles('admin', 'manager', 'accountant'), adminController.getLowStockAlerts);
router.get('/session-history', authorizeRoles('admin', 'manager', 'accountant'), adminController.getUserSessionHistory);

// Routes accessible to admin, manager, accountant, and waiter (viewing uncleared data)
router.get('/uncleared-staff', authorizeRoles('admin', 'manager', 'accountant', 'waiter'), adminController.getUnclearedStaffSummary);
router.get('/uncleared-receipts/:id', authorizeRoles('admin', 'manager', 'accountant', 'waiter'), adminController.getUnclearedStaffReceipts);

// Routes strictly for clearing (admin/manager only as per requirements)
router.post('/clear-previous-data', authorizeRoles('admin', 'manager'), adminController.clearPreviousData);
router.post('/clear-staff/:id', authorizeRoles('admin', 'manager'), adminController.clearStaffData);

export default router;
