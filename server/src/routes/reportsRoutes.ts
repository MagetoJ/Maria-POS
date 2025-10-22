import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as reportsController from '../controllers/reportsController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Personal sales report
router.get('/personal-sales', reportsController.getPersonalSales);

// Waiter sales report
router.get('/waiter-sales', reportsController.getWaiterSales);

// Overview report
router.get('/overview', reportsController.getOverviewReport);

// Sales report
router.get('/sales', reportsController.getSalesReport);

// Inventory report
router.get('/inventory', reportsController.getInventoryReport);

// Staff report
router.get('/staff', reportsController.getStaffReport);

// Rooms report
router.get('/rooms', reportsController.getRoomsReport);

// Performance report
router.get('/performance', reportsController.getPerformanceReport);

export default router;