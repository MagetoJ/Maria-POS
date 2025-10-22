import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';

// Get all staff members
export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await db('staff')
      .select('id', 'employee_id', 'username', 'name', 'role', 'email', 'is_active', 'created_at')
      .orderBy('name', 'asc');
    
    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ message: 'Error fetching staff' });
  }
};

// Get staff member by ID
export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const staff = await db('staff')
      .where({ id })
      .select('id', 'employee_id', 'username', 'name', 'role', 'email', 'is_active', 'created_at')
      .first();

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff member:', err);
    res.status(500).json({ message: 'Error fetching staff member' });
  }
};

// Create new staff member
export const createStaff = async (req: Request, res: Response) => {
  try {
    console.log('📥 Received request body:', req.body);

    const {
      employee_id,
      username,
      name,
      role,
      email,
      password,
      pin,
      is_active
    } = req.body;

    // Validation
    if (!username || !name || !role) {
      console.log('❌ Validation failed: missing required fields');
      return res.status(400).json({ 
        message: 'Username, name, and role are required' 
      });
    }

    // Check if username already exists
    console.log('🔍 Checking if username exists:', username);
    const existingUser = await db('staff').where({ username }).first();
    if (existingUser) {
      console.log('❌ Username already exists');
      return res.status(400).json({ 
        message: 'Username already exists' 
      });
    }

    // Check if employee_id already exists (if provided)
    if (employee_id) {
      console.log('🔍 Checking if employee_id exists:', employee_id);
      const existingEmployeeId = await db('staff').where({ employee_id }).first();
      if (existingEmployeeId) {
        console.log('❌ Employee ID already exists');
        return res.status(400).json({ 
          message: 'Employee ID already exists' 
        });
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      console.log('🔐 Hashing password...');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const insertData = {
      employee_id: employee_id || null,
      username,
      name,
      role,
      email: email || null,
      password: hashedPassword,
      pin: pin || null,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('💾 Inserting staff member:', { ...insertData, password: '***', pin: '***' });

    const [newStaff] = await db('staff')
      .insert(insertData)
      .returning(['id', 'employee_id', 'username', 'name', 'role', 'email', 'is_active', 'created_at']);

    console.log('✅ Staff member created successfully:', newStaff);
    res.status(201).json(newStaff);

  } catch (err) {
    console.error('❌ Error adding staff member:', err);
    console.error('Error details:', {
      message: (err as Error).message,
      stack: (err as Error).stack,
      name: (err as Error).name
    });
    
    res.status(500).json({ 
      message: 'Error adding staff member', 
      error: (err as Error).message 
    });
  }
};

// Update staff member
export const updateStaff = async (req: Request, res: Response) => {
  try {
    console.log('📝 Updating staff member:', req.params.id);
    console.log('📥 Update data:', req.body);

    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove id from update data if present
    delete updateData.id;
    delete updateData.created_at;
    
    // Hash new password if provided
    if (req.body.password) {
      console.log('🔐 Hashing new password...');
      updateData.password = await bcrypt.hash(req.body.password, 10);
    } else {
      // Don't update password if not provided
      delete updateData.password;
    }

    updateData.updated_at = new Date();

    // Check if staff member exists
    const existingStaff = await db('staff').where({ id }).first();
    if (!existingStaff) {
      console.log('❌ Staff member not found');
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check for username uniqueness if being updated
    if (updateData.username && updateData.username !== existingStaff.username) {
      const duplicateUsername = await db('staff')
        .where({ username: updateData.username })
        .whereNot({ id })
        .first();

      if (duplicateUsername) {
        console.log('❌ Username already exists');
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Check for employee_id uniqueness if being updated
    if (updateData.employee_id && updateData.employee_id !== existingStaff.employee_id) {
      const duplicateEmployeeId = await db('staff')
        .where({ employee_id: updateData.employee_id })
        .whereNot({ id })
        .first();

      if (duplicateEmployeeId) {
        console.log('❌ Employee ID already exists');
        return res.status(400).json({ message: 'Employee ID already exists' });
      }
    }

    console.log('💾 Updating with data:', { ...updateData, password: updateData.password ? '***' : undefined });

    const [updatedStaff] = await db('staff')
      .where({ id })
      .update(updateData)
      .returning(['id', 'employee_id', 'username', 'name', 'role', 'email', 'is_active', 'updated_at']);

    console.log('✅ Staff member updated successfully');
    res.json(updatedStaff);

  } catch (err) {
    console.error('❌ Error updating staff member:', err);
    console.error('Error details:', {
      message: (err as Error).message,
      stack: (err as Error).stack
    });
    res.status(500).json({ 
      message: 'Error updating staff member',
      error: (err as Error).message 
    });
  }
};

// Delete staff member (soft delete by deactivating)
export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if staff member exists
    const existingStaff = await db('staff').where({ id }).first();
    if (!existingStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Soft delete by setting is_active to false
    await db('staff')
      .where({ id })
      .update({ 
        is_active: false,
        updated_at: new Date() 
      });

    console.log('✅ Staff member deactivated:', id);
    res.status(204).send();

  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ message: 'Error deleting staff member' });
  }
};

// Get waiters (public endpoint for order creation)
export const getWaiters = async (req: Request, res: Response) => {
  try {
    const waiters = await db('staff')
      .where({ role: 'waiter', is_active: true })
      .select('id', 'employee_id', 'username', 'name')
      .orderBy('name', 'asc');
    
    res.json(waiters);
  } catch (err) {
    console.error('Error fetching waiters:', err);
    res.status(500).json({ message: 'Error fetching waiters' });
  }
};