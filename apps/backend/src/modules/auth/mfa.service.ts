import speakeasy from 'speakeasy';
import QRCode    from 'qrcode';
import bcrypt    from 'bcryptjs';
import crypto    from 'crypto';
import jwt       from 'jsonwebtoken';
import { User }  from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import { env }   from '../../config/env';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

// Temp-token TTL (seconds) — user has 5 min to complete MFA after password auth
const MFA_TEMP_TTL = 300;
const MFA_TEMP_PREFIX = 'mfa:temp:';

export interface MfaSetupResult {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  secret: string; // shown once — user stores in authenticator
}

export class MfaService {
  /** Step 1 — Generate a new TOTP secret and return QR code */
  async setup(userId: number): Promise<MfaSetupResult> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.mfaEnabled) throw new AppError('MFA is already enabled', 400);

    const secret = speakeasy.generateSecret({
      name:   `Lagaao (${user.email})`,
      issuer: 'Lagaao',
      length: 20,
    });

    // Store the pending secret (not yet confirmed)
    await user.update({ mfaSecret: secret.base32 });

    const otpauthUrl = secret.otpauth_url!;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { otpauthUrl, qrCodeDataUrl, secret: secret.base32 };
  }

  /** Step 2 — Verify a TOTP code to confirm setup and enable MFA */
  async enable(userId: number, token: string): Promise<{ backupCodes: string[] }> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (!user.mfaSecret) throw new AppError('MFA setup not initiated', 400);
    if (user.mfaEnabled) throw new AppError('MFA already enabled', 400);

    const valid = speakeasy.totp.verify({
      secret:   user.mfaSecret,
      encoding: 'base32',
      token,
      window:   1,
    });
    if (!valid) throw new AppError('Invalid code', 400);

    // Generate 8 single-use backup codes
    const plainCodes   = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    const hashedCodes  = await Promise.all(plainCodes.map(c => bcrypt.hash(c, 10)));

    await user.update({ mfaEnabled: true, mfaBackupCodes: hashedCodes });
    logger.info(`MFA enabled for user ${userId}`);

    return { backupCodes: plainCodes };
  }

  /** Disable MFA — requires current TOTP or backup code */
  async disable(userId: number, token: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (!user.mfaEnabled) throw new AppError('MFA is not enabled', 400);

    const valid = await this.#verifyTokenOrBackup(user, token);
    if (!valid) throw new AppError('Invalid code', 400);

    await user.update({ mfaEnabled: false, mfaSecret: null, mfaBackupCodes: null });
    logger.info(`MFA disabled for user ${userId}`);
  }

  /** Called after successful password auth when mfaEnabled=true.
   *  Returns a short-lived JWT stored in Redis that can only be used to complete MFA. */
  async issueTempToken(userId: number): Promise<string> {
    const tempToken = jwt.sign(
      { sub: userId, purpose: 'mfa' },
      env.JWT_SECRET,
      { expiresIn: MFA_TEMP_TTL }
    );
    await redis.set(`${MFA_TEMP_PREFIX}${userId}`, tempToken, 'EX', MFA_TEMP_TTL);
    return tempToken;
  }

  /** Complete login: verify TOTP/backup against tempToken, return userId */
  async validate(tempToken: string, token: string): Promise<number> {
    let payload: { sub: number; purpose: string };
    try {
      payload = jwt.verify(tempToken, env.JWT_SECRET) as { sub: number; purpose: string };
    } catch {
      throw new AppError('Invalid or expired MFA session', 401);
    }
    if (payload.purpose !== 'mfa') throw new AppError('Invalid token purpose', 401);

    const userId = payload.sub;

    // Check Redis to ensure it hasn't been used
    const stored = await redis.get(`${MFA_TEMP_PREFIX}${userId}`);
    if (!stored || stored !== tempToken) throw new AppError('MFA session expired or already used', 401);

    const user = await User.findByPk(userId);
    if (!user || !user.mfaEnabled) throw new AppError('User not found or MFA not enabled', 400);

    const valid = await this.#verifyTokenOrBackup(user, token);
    if (!valid) throw new AppError('Invalid MFA code', 401);

    // Consume the temp token
    await redis.del(`${MFA_TEMP_PREFIX}${userId}`);
    return userId;
  }

  /** Verify TOTP token or a backup code (backup codes are single-use) */
  async #verifyTokenOrBackup(user: User, token: string): Promise<boolean> {
    // Try TOTP first
    if (user.mfaSecret) {
      const ok = speakeasy.totp.verify({
        secret:   user.mfaSecret,
        encoding: 'base32',
        token,
        window:   1,
      });
      if (ok) return true;
    }

    // Try backup codes
    const codes = user.mfaBackupCodes ?? [];
    for (let i = 0; i < codes.length; i++) {
      const match = await bcrypt.compare(token, codes[i]);
      if (match) {
        // Remove used backup code
        const remaining = codes.filter((_, idx) => idx !== i);
        await user.update({ mfaBackupCodes: remaining });
        return true;
      }
    }
    return false;
  }

  /** Regenerate backup codes — requires current TOTP */
  async regenerateBackupCodes(userId: number, token: string): Promise<{ backupCodes: string[] }> {
    const user = await User.findByPk(userId);
    if (!user || !user.mfaEnabled) throw new AppError('MFA not enabled', 400);

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret!, encoding: 'base32', token, window: 1,
    });
    if (!valid) throw new AppError('Invalid code', 400);

    const plainCodes  = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    const hashedCodes = await Promise.all(plainCodes.map(c => bcrypt.hash(c, 10)));
    await user.update({ mfaBackupCodes: hashedCodes });

    return { backupCodes: plainCodes };
  }
}

export const mfaService = new MfaService();
