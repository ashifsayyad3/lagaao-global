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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: Account created — OTP sent to email
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email OTP after registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, format: email }
 *               otp:   { type: string, example: '123456' }
 *     responses:
 *       200:
 *         description: Email verified
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in and receive access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid credentials
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange refresh-token cookie for a new access token
 *     responses:
 *       200:
 *         description: New access token issued
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate the current session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset OTP sent (always 200 to prevent enumeration)
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Set a new password using the OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, password]
 *             properties:
 *               email:    { type: string }
 *               otp:      { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Unauthenticated
 */

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
