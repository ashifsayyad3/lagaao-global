import { Router, Request, Response, NextFunction } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { User } from '../../models';
import { ok } from '../../shared/utils/response.util';

const router = Router();

router.use(authenticate); // All user routes require auth

router.get('/profile',                    (r, s, n) => usersController.getProfile(r, s, n));
router.patch('/profile',                  (r, s, n) => usersController.updateProfile(r, s, n));
router.post('/change-password',           (r, s, n) => usersController.changePassword(r, s, n));

router.get('/addresses',                  (r, s, n) => usersController.getAddresses(r, s, n));
router.post('/addresses',                 (r, s, n) => usersController.addAddress(r, s, n));
router.patch('/addresses/:id',            (r, s, n) => usersController.updateAddress(r, s, n));
router.delete('/addresses/:id',           (r, s, n) => usersController.deleteAddress(r, s, n));

// GET /api/v1/users/me/preferences
router.get('/me/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id, { attributes: ['whatsappOptIn'] });
    ok(res, { whatsappOptIn: user?.whatsappOptIn ?? true });
  } catch (e) { next(e); }
});

// PATCH /api/v1/users/me/preferences
router.patch('/me/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { whatsappOptIn } = req.body as { whatsappOptIn?: boolean };
    await User.update(
      { whatsappOptIn: whatsappOptIn ?? true },
      { where: { id: req.user!.id } }
    );
    ok(res, null, 'Preferences updated');
  } catch (e) { next(e); }
});

export default router;
