import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: string;
      name?: string;
      employee_id?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
