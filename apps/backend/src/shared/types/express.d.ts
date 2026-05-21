import { Role } from './roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id:    number;
        email: string;
        role:  Role;
      };
    }
  }
}

export {};
