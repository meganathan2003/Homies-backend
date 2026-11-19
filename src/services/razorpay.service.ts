import crypto from 'crypto';
import { razorpayClient } from '../config/razorpay';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

function safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
    // Mock mode (dev only): Razorpay ku poga maatom, fake order id return pannum
    if (env.razorpay.mode === 'mock') {
        return { id: `order_mock_${crypto.randomBytes(8).toString('hex')}`, amount: amountPaise, currency: 'INR' };
    }
    if (!env.razorpay.keyId || !env.razorpay.keySecret) throw new HttpError(503, 'Payments are not configured');
    try {
        const order = await razorpayClient().orders.create({ amount: amountPaise, currency: 'INR', receipt, notes });
        return { id: order.id, amount: Number(order.amount), currency: order.currency };
    } catch (err) {
        console.error('Razorpay order error, status:', (err as { statusCode?: number }).statusCode);
        throw new HttpError(502, 'Could not create the payment order. Please try again.');
    }
}

/** Android Razorpay checkout success la kudukkura signature ah verify pannum. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = env.razorpay.keySecret;
    if (!secret) throw new HttpError(503, 'Payments are not configured');
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
}

/** Razorpay webhook signature (raw body mela HMAC). */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    const secret = env.razorpay.webhookSecret;
    if (!secret) throw new HttpError(503, 'Webhook is not configured');
    if (!signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
}