import { Request, Response } from 'express';
import db from '../db';

// Get all rooms
export const getRooms = async (req: Request, res: Response) => {
  try {
    // Check if rooms table exists
    const hasRoomsTable = await db.schema.hasTable('rooms');
    if (!hasRoomsTable) {
      return res.json([]); // Return empty array if table doesn't exist
    }

    const rooms = await db('rooms')
      .select('*')
      .orderBy('room_number', 'asc');

    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

// Update room details
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };

    // Check if room exists
    const existingRoom = await db('rooms').where({ id }).first();
    if (!existingRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const [updatedRoom] = await db('rooms')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json(updatedRoom);
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ message: 'Error updating room' });
  }
};

// Get room by ID
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await db('rooms').where({ id }).first();

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (err) {
    console.error('Error fetching room:', err);
    res.status(500).json({ message: 'Error fetching room' });
  }
};

// Create new room
export const createRoom = async (req: Request, res: Response) => {
  try {
    const {
      room_number,
      room_type,
      status,
      rate,
      max_occupancy,
      amenities,
      floor
    } = req.body;

    // Validation
    if (!room_number || !room_type) {
      return res.status(400).json({ 
        message: 'Room number and room type are required' 
      });
    }

    // Check if room number already exists
    const existingRoom = await db('rooms').where({ room_number }).first();
    if (existingRoom) {
      return res.status(400).json({ 
        message: 'Room number already exists' 
      });
    }

    const [newRoom] = await db('rooms')
      .insert({
        room_number,
        room_type,
        status: status || 'vacant',
        rate: rate || 0,
        max_occupancy: max_occupancy || 1,
        amenities: amenities || '',
        floor: floor || 1,
        
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    res.status(201).json(newRoom);

  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ message: 'Error creating room' });
  }
};

// Delete room
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if room exists
    const existingRoom = await db('rooms').where({ id }).first();
    if (!existingRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has active bookings
    const activeBookings = await db('room_transactions')
      .where({ room_id: id, status: 'active' })
      .first();

    if (activeBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active bookings' 
      });
    }

    await db('rooms').where({ id }).del();
    res.json({ message: 'Room deleted successfully' });

  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ message: 'Error deleting room' });
  }
};

// Check-in guest to room
export const checkInRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { 
    guest_name, 
    guest_contact, 
    check_in_date, 
    check_out_date, 
    staffName, 
    authPin,
    nights,
    rate,
    total_price
  } = req.body;
  
  let staff_id: number;
  let staff_username: string;
  
  // If user is authenticated via token, use their ID
  if (req.user) {
    staff_id = req.user.id;
    staff_username = req.user.username;
  } else {
    // Action-based validation (Name/PIN) for public access
    if (!staffName || !authPin) {
      return res.status(401).json({ message: 'Authentication required. Please provide Staff Name and PIN.' });
    }

    const user = await db('staff')
      .where({ username: staffName, pin: authPin, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid Staff Name or PIN.' });
    }
    staff_id = user.id;
    staff_username = user.username;
  }
  
  if (!guest_name) {
    return res.status(400).json({ message: 'Guest name is required.' });
  }

  // Calculate check_out_date if nights is provided
  let calculated_check_out = check_out_date;
  const effective_check_in = check_in_date || new Date();
  
  if (!calculated_check_out && nights) {
    const checkIn = new Date(effective_check_in);
    checkIn.setDate(checkIn.getDate() + parseInt(nights));
    calculated_check_out = checkIn;
  }
  
  try {
    await db.transaction(async (trx) => {
      const [room] = await trx('rooms')
        .where({ id: roomId, status: 'vacant' })
        .update({ 
          status: 'occupied',
          guest_name: guest_name,
          check_in_date: effective_check_in,
          check_out_date: calculated_check_out || null
        })
        .returning('*');
      
      if (!room) {
        throw new Error('Room is not vacant or available for check-in.');
      }
      
      await trx('room_transactions').insert({
        room_id: roomId,
        staff_id,
        guest_name,
        guest_contact,
        status: 'active',
        check_in_time: effective_check_in,
        check_out_time: calculated_check_out || null,
        nights: nights || 1,
        rate_at_time: rate || room.rate || 0,
        total_price: total_price || (room.rate * (nights || 1)) || 0,
        total_amount: total_price || (room.rate * (nights || 1)) || 0, // Fill both columns for safety
        checked_in_by: staff_username,
        created_at: new Date()
      });
      
      res.json(room);
    });
  } catch (err) {
    res.status(500).json({ 
      message: (err as Error).message || 'Failed to check-in guest.' 
    });
  }
};

// Check-out guest from room
export const checkOutRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { staffName, authPin } = req.body;
  
  let staff_id: number;
  let clearedBy: string;
  
  // If user is authenticated via token, use their ID
  if (req.user) {
    staff_id = req.user.id;
    clearedBy = req.user.username;
  } else {
    // Action-based validation (Name/PIN) for public access
    if (!staffName || !authPin) {
      return res.status(401).json({ message: 'Authentication required. Please provide Staff Name and PIN.' });
    }

    const user = await db('staff')
      .where({ username: staffName, pin: authPin, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid Staff Name or PIN.' });
    }
    staff_id = user.id;
    clearedBy = user.username;
  }
  
  try {
    await db.transaction(async (trx) => {
      // Get the active transaction first to get the total amount
      const transaction = await trx('room_transactions')
        .where({ room_id: roomId, status: 'active' })
        .first();

      const [room] = await trx('rooms')
        .where({ id: roomId, status: 'occupied' })
        .update({ 
          status: 'cleaning', // This shows as "Dirty" in the frontend
          guest_name: null,
          check_in_date: null,
          check_out_date: null
        })
        .returning('*');
      
      if (!room) {
        throw new Error('Room is not occupied or does not exist.');
      }
      
      await trx('room_transactions')
        .where({ room_id: roomId, status: 'active' })
        .update({
          status: 'completed',
          check_out_time: new Date()
        });
      
      // Return data for receipt generation
      res.json({
        ...room,
        clearedBy: clearedBy,
        total: transaction ? (transaction.total_price || transaction.total_amount) : (room.rate || 0),
        roomNumber: room.room_number,
        roomType: room.room_type,
        guestName: transaction?.guest_name || 'Guest'
      });
    });
  } catch (err) {
    res.status(500).json({ 
      message: (err as Error).message || 'Failed to check-out guest.' 
    });
  }
};

// Get room statistics
export const getRoomStats = async (req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      // Total rooms
      db('rooms').count('* as count').first(),
      
      // Vacant rooms
      db('rooms').where('status', 'vacant').count('* as count').first(),
      
      // Occupied rooms
      db('rooms').where('status', 'occupied').count('* as count').first(),
      
      // Maintenance rooms
      db('rooms').where('status', 'maintenance').count('* as count').first(),
      
      // Average occupancy rate today
      db('room_transactions')
        .where('created_at', '>=', new Date(new Date().setHours(0, 0, 0, 0)))
        .where('status', 'active')
        .count('* as count')
        .first()
    ]);

    const [totalRooms, vacantRooms, occupiedRooms, maintenanceRooms, activeBookings] = stats;

    const total = parseInt(totalRooms?.count as string) || 0;
    const occupied = parseInt(occupiedRooms?.count as string) || 0;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    res.json({
      totalRooms: total,
      vacantRooms: parseInt(vacantRooms?.count as string) || 0,
      occupiedRooms: occupied,
      maintenanceRooms: parseInt(maintenanceRooms?.count as string) || 0,
      occupancyRate,
      activeBookings: parseInt(activeBookings?.count as string) || 0
    });

  } catch (err) {
    console.error('Error fetching room stats:', err);
    res.status(500).json({ message: 'Error fetching room statistics' });
  }
};