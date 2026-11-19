import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import * as walletService from '../services/wallet.service';
import { listQuerySchema } from '../validators/wallet.validator';
import { ok } from '../utils/response';

export async function getWallet(req: Request, res: Response) {
    const balancePaise = await walletService.getBalancePaise(req.user!.id);
    return ok(res, { balance: walletService.toRupees(balancePaise), balancePaise, currency: 'INR' });
}

export async function transactions(req: Request, res: Response) {
    const { page, limit } = listQuerySchema.parse(req.query);
    const { items, total } = await walletService.listTransactions(req.user!.id, page, limit);
    return ok(res, {
        transactions: items.map((t) => ({
            id: t.id,
            type: t.type,
            amount: walletService.toRupees(t.amount),
            balanceAfter: walletService.toRupees(t.balanceAfter),
            reason: t.reason,
            description: t.description,
            createdAt: t.createdAt,
        })),
        page,
        limit,
        total,
        hasMore: page * limit < total,
    });
}

export async function createTopupOrder(req: Request, res: Response) {
    const order = await paymentService.createTopupOrder(req.user!, req.body.amount);
    return ok(res, order, 'Order created', 201);
}

export async function verifyTopup(req: Request, res: Response) {
    const r = await paymentService.verifyTopup(req.user!, req.body);
    return ok(
        res,
        { status: r.status, credited: r.credited, balance: walletService.toRupees(r.balancePaise), balancePaise: r.balancePaise },
        r.credited ? 'Wallet topped up' : 'Payment already processed',
    );
}

export async function reportFailure(req: Request, res: Response) {
    const r = await paymentService.reportFailure(req.user!, req.body.razorpay_order_id, req.body.reason);
    return ok(res, r, 'Payment failure recorded');
}