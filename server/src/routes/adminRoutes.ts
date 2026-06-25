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

// --- Access Requests Routes ---
router.get('/access-requests', authorizeRoles('admin', 'manager'), adminController.getAccessRequests);
router.post('/access-requests', authorizeRoles('admin', 'manager', 'waiter', 'cashier'), adminController.createAccessRequest);
router.put('/access-requests/:id', authorizeRoles('admin', 'manager'), adminController.handleAccessRequest);
router.get('/access-requests/check', authorizeRoles('admin', 'manager', 'waiter', 'cashier'), adminController.checkRequestStatus);

router.get('/access-requests', authorizeRoles('admin', 'manager'), adminController.getAccessRequests);
router.post('/access-requests', authorizeRoles('admin', 'manager', 'waiter', 'cashier'), adminController.createAccessRequest);
router.put('/access-requests/:id', authorizeRoles('admin', 'manager'), adminController.handleAccessRequest);
router.get('/access-requests/check', authorizeRoles('admin', 'manager', 'waiter', 'cashier'), adminController.checkRequestStatus);

export default router;
