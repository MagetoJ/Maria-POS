import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// It's best practice to store your secret in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

// Extend the Request interface to include the user property
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

/**
 * Middleware to authenticate a JWT token.
 * It verifies the token from the Authorization header and attaches the user payload to the request.
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware to authorize users based on their roles.
 * Must be used after authenticateToken.
 * @param allowedRoles - An array of roles that are allowed to access the route.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access forbidden: User role is missing.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access forbidden: Your role "${req.user.role}" is not authorized.` });
    }

    next();
  };
};