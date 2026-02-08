// server/src/routes/reportsRoutes.ts
import express from 'express';
// --- MODIFICATION: Import authorizeRoles ---
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import * as reportsController from '../controllers/reportsController';

const router = express.Router();

// --- ADD NEW ADMIN/ACCOUNTANT ROUTE HERE ---
// This route is checked first and is restricted to admins and accountants.
router.get(
  '/receipts',
  authenticateToken,
  authorizeRoles('admin', 'accountant'), // Ensures only admins and accountants can access
  reportsController.getReceiptsByDate // The new controller function
);


// All routes below this line require authentication for *any* role
router.use(authenticateToken);

// Personal sales report
router.get('/personal-sales', reportsController.getPersonalSales);

// Waiter sales report
router.get('/waiter-sales', reportsController.getWaiterSales);

// Overview report
router.get('/overview', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getOverviewReport);

// Sales report
router.get('/sales', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getSalesReport);

// Inventory report
router.get('/inventory', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getInventoryReport);

// Staff report
router.get('/staff', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getStaffReport);

// Rooms report
router.get('/rooms', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getRoomsReport);

// Performance report
router.get('/performance', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getPerformanceReport);

// Annual report
router.get('/annual', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getAnnualReport);

// New Analytics Features
router.get('/hourly', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getHourlySales);
router.get('/payments', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getPaymentStats);
router.get('/menu-analysis', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getMenuAnalysis);
router.get('/wastage', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getWastageStats);

// Accountant specific reports
router.get('/price-variance', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getPriceVarianceReport);
router.get('/dead-stock', authorizeRoles('admin', 'manager', 'accountant'), reportsController.getDeadStockReport);
router.get('/detailed-accounting', authorizeRoles('admin', 'accountant'), reportsController.getDetailedAccountingReport);

export default router;