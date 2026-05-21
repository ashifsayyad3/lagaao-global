import { Router } from 'express';
import { authController } from './auth.controller';
import {
  validate,
  registerSchema, loginSchema, verifyOtpSchema,
  forgotPasswordSchema, resetPasswordSchema,
} from './auth.validator';
import { authRateLimit } from '../../middleware/rateLimit.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Public
router.post('/register',        authRateLimit, validate(registerSchema),       (r, s, n) => authController.register(r, s, n));
router.post('/verify-otp',      authRateLimit, validate(verifyOtpSchema),       (r, s, n) => authController.verifyOtp(r, s, n));
router.post('/resend-otp',      authRateLimit,                                  (r, s, n) => authController.resendOtp(r, s, n));
router.post('/login',           authRateLimit, validate(loginSchema),           (r, s, n) => authController.login(r, s, n));
router.post('/refresh',                                                          (r, s, n) => authController.refresh(r, s, n));
router.post('/logout',                                                           (r, s, n) => authController.logout(r, s, n));
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema),  (r, s, n) => authController.forgotPassword(r, s, n));
router.post('/reset-password',  authRateLimit, validate(resetPasswordSchema),   (r, s, n) => authController.resetPassword(r, s, n));

// Protected
router.get('/me', authenticate, (r, s, n) => authController.me(r, s, n));

export default router;
