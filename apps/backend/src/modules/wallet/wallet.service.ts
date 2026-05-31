import { Request } from 'express';
import { Transaction as SequelizeTransaction } from 'sequelize';
import { sequelize } from '../../models/index';
import { Wallet, WalletTransaction, WalletTxType } from '../../models/wallet.model';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';

interface CreditInput {
  userId: number;
  amount: number;
  type: WalletTxType;
  description?: string;
  referenceType?: string;
  referenceId?: number;
  meta?: Record<string, unknown>;
  t?: SequelizeTransaction;
}

interface DebitInput extends CreditInput {
  failIfInsufficient?: boolean;
}

export class WalletService {
  /** Get or create a wallet for user */
  async getOrCreate(userId: number): Promise<Wallet> {
    const [wallet] = await Wallet.findOrCreate({
      where: { userId },
      defaults: { userId, balance: 0, totalCredited: 0, totalDebited: 0 },
    });
    return wallet;
  }

  /** Get wallet balance */
  async getBalance(userId: number): Promise<{ balance: number; isFrozen: boolean }> {
    const wallet = await this.getOrCreate(userId);
    return { balance: Number(wallet.balance), isFrozen: wallet.isFrozen };
  }

  /** Credit wallet */
  async credit(input: CreditInput): Promise<WalletTransaction> {
    const { userId, amount, type, description, referenceType, referenceId, meta } = input;
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    const doCredit = async (t: SequelizeTransaction) => {
      const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: true });
      if (!wallet) throw new AppError('Wallet not found', 404);
      if (wallet.isFrozen) throw new AppError('Wallet is frozen', 403);

      const newBalance = Number(wallet.balance) + amount;
      await wallet.update({
        balance: newBalance,
        totalCredited: Number(wallet.totalCredited) + amount,
      }, { transaction: t });

      return WalletTransaction.create({
        walletId: wallet.id, userId, type, amount, balanceAfter: newBalance,
        description: description ?? null,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        meta: meta ?? null,
      }, { transaction: t });
    };

    if (input.t) return doCredit(input.t);
    return sequelize.transaction(doCredit);
  }

  /** Debit wallet */
  async debit(input: DebitInput): Promise<WalletTransaction> {
    const { userId, amount, type, description, referenceType, referenceId, meta, failIfInsufficient = true } = input;
    if (amount <= 0) throw new AppError('Debit amount must be positive', 400);

    const doDebit = async (t: SequelizeTransaction) => {
      const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: true });
      if (!wallet) throw new AppError('Wallet not found', 404);
      if (wallet.isFrozen) throw new AppError('Wallet is frozen', 403);

      const currentBalance = Number(wallet.balance);
      if (failIfInsufficient && currentBalance < amount) {
        throw new AppError(`Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}`, 400);
      }

      const deductAmount = Math.min(amount, currentBalance);
      const newBalance = currentBalance - deductAmount;
      await wallet.update({
        balance: newBalance,
        totalDebited: Number(wallet.totalDebited) + deductAmount,
      }, { transaction: t });

      return WalletTransaction.create({
        walletId: wallet.id, userId, type, amount: deductAmount, balanceAfter: newBalance,
        description: description ?? null,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        meta: meta ?? null,
      }, { transaction: t });
    };

    if (input.t) return doDebit(input.t);
    return sequelize.transaction(doDebit);
  }

  /** List wallet transactions for user */
  async listTransactions(userId: number, req: Request) {
    const wallet = await this.getOrCreate(userId);
    const { limit, offset, page } = getPagination(req, 20);

    const { count, rows } = await WalletTransaction.findAndCountAll({
      where: { walletId: wallet.id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      balance: Number(wallet.balance),
      isFrozen: wallet.isFrozen,
      transactions: rows,
      meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  /** Admin: top-up or deduct wallet for any user */
  async adminAdjust(targetUserId: number, amount: number, note: string, adminId: number): Promise<WalletTransaction> {
    await this.getOrCreate(targetUserId);
    if (amount >= 0) {
      return this.credit({
        userId: targetUserId,
        amount,
        type: 'admin_credit',
        description: note || 'Admin credit',
        referenceType: 'admin',
        referenceId: adminId,
      });
    } else {
      return this.debit({
        userId: targetUserId,
        amount: Math.abs(amount),
        type: 'admin_debit',
        description: note || 'Admin debit',
        referenceType: 'admin',
        referenceId: adminId,
        failIfInsufficient: false,
      });
    }
  }

  /** Admin: freeze/unfreeze wallet */
  async adminSetFrozen(targetUserId: number, frozen: boolean): Promise<void> {
    const wallet = await this.getOrCreate(targetUserId);
    await wallet.update({ isFrozen: frozen });
  }

  /** Admin: list all wallets */
  async adminList(req: Request) {
    const { limit, offset, page } = getPagination(req, 25);
    const { count, rows } = await Wallet.findAndCountAll({
      limit, offset,
      order: [['balance', 'DESC']],
      include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
    });
    return { wallets: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }
}

export const walletService = new WalletService();
