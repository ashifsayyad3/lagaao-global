import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ok } from '../../shared/utils/response.util';
import { AppError } from '../../middleware/errorHandler.middleware';
import { authService } from '../auth/auth.service';

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getProfile(req.user!.id);
      ok(res, user.toJSON());
    } catch (e) { next(e); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, phone, avatar } = req.body;
      const user = await usersService.updateProfile(req.user!.id, { name, phone, avatar });
      ok(res, user.toJSON(), 'Profile updated');
    } catch (e) { next(e); }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await usersService.getAddresses(req.user!.id);
      ok(res, addresses);
    } catch (e) { next(e); }
  }

  async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await usersService.addAddress(req.user!.id, req.body);
      ok(res, address, 'Address added', 201);
    } catch (e) { next(e); }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id'], 10);
      const address = await usersService.updateAddress(req.user!.id, id, req.body);
      ok(res, address, 'Address updated');
    } catch (e) { next(e); }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id'], 10);
      await usersService.deleteAddress(req.user!.id, id);
      ok(res, null, 'Address deleted');
    } catch (e) { next(e); }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await usersService.changePassword(req.user!.id, currentPassword, newPassword);
      ok(res, null, 'Password changed successfully');
    } catch (e) { next(e); }
  }
}

export const usersController = new UsersController();
