import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { HttpError } from '../utils/httpError';
import { ok } from '../utils/response';

export async function webhook(req: Request, res: Response) {
    const raw = req.body;
    if (!Buffer.isBuffer(raw)) throw new HttpError(400, 'Invalid body');
    await paymentService.handleWebhook(raw, req.header('x-razorpay-signature'));
    return res.status(200).json({ received: true });
}

/** Edha payment (top-up, consultation, story) fail aanaalum idhaiye use pannalam. */
export async function failure(req: Request, res: Response) {
    const r = await paymentService.reportFailure(req.user!, req.body.razorpay_order_id, req.body.reason);
    return ok(res, r, 'Payment failure recorded');
}