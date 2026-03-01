import { Router } from 'express';
import * as roomController from '../controllers/roomController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// PUBLIC ROUTES (No token required for viewing)
// Get all rooms (available to all users)
router.get('/', roomController.getRooms);

// Get specific room by ID
router.get('/:id', roomController.getRoomById);

// Room check-in and check-out (Validated via Name/PIN if no token)
router.post('/:roomId/check-in', roomController.checkInRoom);
router.post('/:roomId/check-out', roomController.checkOutRoom);

// PROTECTED ROUTES (Token required for sensitive actions)
router.use(authenticateToken);

// Get room statistics
router.get('/stats', roomController.getRoomStats);

// Create new room (admin and manager only)
router.post('/', 
  authorizeRoles('admin', 'manager'), 
  roomController.createRoom
);

// Update room (admin, manager, receptionist, housekeeping)
router.put('/:id', 
  authorizeRoles('admin', 'manager', 'receptionist', 'housekeeping'), 
  roomController.updateRoom
);

// Delete room (admin and manager only)
router.delete('/:id', 
  authorizeRoles('admin', 'manager'), 
  roomController.deleteRoom
);

export default router;