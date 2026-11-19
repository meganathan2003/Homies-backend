import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { HttpError } from '../utils/httpError';

export async function webhook(req: Request, res: Response) {
    const raw = req.body;
    if (!Buffer.isBuffer(raw)) throw new HttpError(400, 'Invalid body');
    await paymentService.handleWebhook(raw, req.header('x-razorpay-signature'));
    return res.status(200).json({ received: true });
}