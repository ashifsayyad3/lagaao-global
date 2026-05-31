import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';
import { walletService } from './wallet.service';
import { ok } from '../../shared/utils/response.util';

const router = Router();

/** GET /api/v1/wallet — balance + transactions */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await walletService.listTransactions(req.user!.id, req);
    res.json(ok(result));
  } catch (e) { next(e); }
});

/** GET /api/v1/wallet/balance — balance only (lightweight) */
router.get('/balance', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await walletService.getBalance(req.user!.id);
    res.json(ok(result));
  } catch (e) { next(e); }
});

export { router as walletRoutes };

// ── Admin routes ──────────────────────────────────────────────
const adminRouter = Router();

/** GET /api/v1/admin/wallets */
adminRouter.get('/', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await walletService.adminList(req);
      res.json(ok(result));
    } catch (e) { next(e); }
  });

/** POST /api/v1/admin/wallets/:userId/adjust */
adminRouter.post('/:userId/adjust', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, note } = req.body as { amount: number; note?: string };
      const tx = await walletService.adminAdjust(
        Number(req.params['userId']), Number(amount), note ?? '', req.user!.id,
      );
      res.json(ok(tx, amount >= 0 ? 'Wallet credited' : 'Wallet debited'));
    } catch (e) { next(e); }
  });

/** PATCH /api/v1/admin/wallets/:userId/freeze */
adminRouter.patch('/:userId/freeze', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { frozen } = req.body as { frozen: boolean };
      await walletService.adminSetFrozen(Number(req.params['userId']), frozen);
      res.json(ok(null, frozen ? 'Wallet frozen' : 'Wallet unfrozen'));
    } catch (e) { next(e); }
  });

export { adminRouter as adminWalletRouter };
