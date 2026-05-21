import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate); // All user routes require auth

router.get('/profile',                    (r, s, n) => usersController.getProfile(r, s, n));
router.patch('/profile',                  (r, s, n) => usersController.updateProfile(r, s, n));
router.post('/change-password',           (r, s, n) => usersController.changePassword(r, s, n));

router.get('/addresses',                  (r, s, n) => usersController.getAddresses(r, s, n));
router.post('/addresses',                 (r, s, n) => usersController.addAddress(r, s, n));
router.patch('/addresses/:id',            (r, s, n) => usersController.updateAddress(r, s, n));
router.delete('/addresses/:id',           (r, s, n) => usersController.deleteAddress(r, s, n));

export default router;
