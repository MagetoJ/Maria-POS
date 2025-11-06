import { Router } from 'express';
import * as quickPOSController from '../controllers/quickPOSController';

const router = Router();

// PUBLIC ROUTES - No authentication required for Quick POS bar sales
// Get bar items formatted as products for Quick POS (accessible without authentication)
router.get('/bar-items-as-products',
  quickPOSController.getBarItemsAsProducts
);

// Sell bar inventory item - public access (no authentication required)
router.post('/sell-item',
  quickPOSController.sellBarItem
);

export default router;