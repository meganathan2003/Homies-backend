import { Wallet } from '../models/wallet.model';
import { TxnReason, WalletTransaction } from '../models/walletTransaction.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';

export type LedgerMeta = { reason: TxnReason; refType?: string; refId?: string; description?: string };

async function ensureWallet(userId: string) {
    try {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId, balance: 0 } },
            { upsert: true, new: true },
        );
    } catch (err) {
        if ((err as { code?: number }).code === 11000) return (await Wallet.findOne({ userId }))!;
        throw err;
    }
}

export async function getBalancePaise(userId: string): Promise<number> {
    return (await ensureWallet(userId))!.balance;
}

/** Wallet ku panam serkka. Same refType+refId two times vandhaalum oru thadavai mattum credit aagum. */
export async function credit(userId: string, amountPaise: number, meta: LedgerMeta): Promise<number> {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) throw new HttpError(400, 'Invalid amount');
    if (meta.refType && meta.refId) {
        const done = await WalletTransaction.exists({ userId, type: 'credit', refType: meta.refType, refId: meta.refId });
        if (done) return getBalancePaise(userId);
    }
    await ensureWallet(userId);
    const w = await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: amountPaise } }, { new: true });
    await WalletTransaction.create({
        id: newId('txn'), userId, type: 'credit', amount: amountPaise, balanceAfter: w!.balance, ...meta,
    });
    return w!.balance;
}

/** Wallet la irundhu panam edukka (story purchase, consultation...). Balance kammi na 402. */
export async function debit(userId: string, amountPaise: number, meta: LedgerMeta): Promise<number> {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) throw new HttpError(400, 'Invalid amount');
    await ensureWallet(userId);
    const w = await Wallet.findOneAndUpdate(
        { userId, balance: { $gte: amountPaise } },
        { $inc: { balance: -amountPaise } },
        { new: true },
    );
    if (!w) throw new HttpError(402, 'Insufficient wallet balance');
    await WalletTransaction.create({
        id: newId('txn'), userId, type: 'debit', amount: amountPaise, balanceAfter: w.balance, ...meta,
    });
    return w.balance;
}

export async function listTransactions(userId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
        WalletTransaction.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        WalletTransaction.countDocuments({ userId }),
    ]);
    return { items, total };
}

export const toRupees = (paise: number): number => paise / 100;