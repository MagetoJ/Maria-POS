import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db';
import config from '../config/environment';
import { sendResetEmail, generateResetCode } from '../utils/email';
import { isValidEmail, isValidPassword } from '../utils/validation';

// Login endpoint
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user in database
    const user = await db('staff')
      .where({ username, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if password field exists and compare
    if (!user.password) {
      return res.status(401).json({ message: 'Account not properly configured. Please contact administrator.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Track user session
    try {
      // First, mark any existing sessions as inactive
      await db('user_sessions')
        .where({ user_id: user.id, is_active: true })
        .update({ is_active: false, logout_time: new Date() });

      // Create new session
      await db('user_sessions').insert({
        user_id: user.id,
        login_time: new Date(),
        session_token: token,
        is_active: true
      });
    } catch (sessionError) {
      console.error('Session tracking error:', sessionError);
      // Don't fail login if session tracking fails
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PIN validation endpoint (for Quick POS Access)
export const validatePin = async (req: Request, res: Response) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ message: 'Username and PIN are required' });
    }

    // Find user in database by username and PIN
    const user = await db('staff')
      .where({ username, pin, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or PIN' });
    }

    // Return user data without generating a JWT token (for quick access)
    res.json({
      id: user.id,
      employee_id: user.employee_id,
      username: user.username,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });

  } catch (error) {
    console.error('PIN validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    const user = await db('staff')
      .where({ email, is_active: true })
      .first();

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a reset code has been sent.' });
    }

    // Generate reset code and expiry (10 minutes from now)
    const resetCode = generateResetCode();
    const resetExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store reset code in database
    await db('staff')
      .where({ id: user.id })
      .update({
        reset_code: resetCode,
        reset_code_expires: resetExpiry
      });

    // Send email
    const emailSent = await sendResetEmail(email, resetCode, user.name);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    res.json({ message: 'If the email exists, a reset code has been sent.' });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset password with code
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: 'Email, reset code, and new password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    const passwordValidation = isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Find user with valid reset code
    const user = await db('staff')
      .where({ 
        email, 
        reset_code: resetCode,
        is_active: true 
      })
      .where('reset_code_expires', '>', new Date())
      .first();

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    await db('staff')
      .where({ id: user.id })
      .update({
        password: hashedPassword,
        reset_code: null,
        reset_code_expires: null,
        updated_at: new Date()
      });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await db('staff')
      .where({ id: req.user.id, is_active: true })
      .select('id', 'username', 'name', 'role', 'email', 'created_at')
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout endpoint
export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Mark session as inactive
    await db('user_sessions')
      .where({ session_token: token, is_active: true })
      .update({
        is_active: false,
        logout_time: new Date(),
        updated_at: new Date()
      });

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};