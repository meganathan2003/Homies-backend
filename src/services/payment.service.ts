import { env } from '../config/env';
import { UserDoc } from '../models/user.model';
import { Payment } from '../models/payment.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';
import * as razorpay from './razorpay.service';
import * as wallet from './wallet.service';

export async function createTopupOrder(user: UserDoc, amountInr: number) {
    const amount = amountInr * 100; // paise
    const paymentId = newId('pay');
    const order = await razorpay.createOrder(amount, paymentId, {
        userId: user.id, paymentId, purpose: 'wallet_topup',
    });
    await Payment.create({
        id: paymentId, userId: user.id, purpose: 'wallet_topup', amount, currency: 'INR',
        razorpayOrderId: order.id, status: 'created',
    });
    return {
        paymentId,
        orderId: order.id,
        amount, // paise (Razorpay checkout ku idhaiye kudukkanum)
        currency: 'INR',
        keyId: env.razorpay.keyId || 'rzp_test_mock',
    };
}

/** Payment ah 'paid' nu oru thadavai mattum claim panni wallet la credit pannum. Verify and webhook rendum idhaiye use pannum. */
async function settle(orderId: string, paymentId: string, signature?: string) {
    const claimed = await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $in: ['created', 'failed'] } },
        { $set: { status: 'paid', razorpayPaymentId: paymentId, razorpaySignature: signature, paidAt: new Date() }, $unset: { failureReason: '' } },
        { new: true },
    );
    if (!claimed) {
        const existing = await Payment.findOne({ razorpayOrderId: orderId });
        if (!existing) throw new HttpError(404, 'Payment not found');
        return { payment: existing, credited: false };
    }
    await wallet.credit(claimed.userId, claimed.amount, { reason: 'topup', refType: 'payment', refId: claimed.id, description: 'Wallet top-up' });
    return { payment: claimed, credited: true };
}

export async function verifyTopup(
    user: UserDoc,
    input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
) {
    const payment = await Payment.findOne({ razorpayOrderId: input.razorpay_order_id, userId: user.id });
    if (!payment) throw new HttpError(404, 'Payment not found');

    if (!razorpay.verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
        throw new HttpError(400, 'Payment verification failed');
    }
    const { payment: p, credited } = await settle(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature);
    return { status: p.status, credited, balancePaise: await wallet.getBalancePaise(user.id) };
}

/** App payment fail aachu nu sollumbodhu record panna (retry paakka). Later same order paid aanaalum verify work aagum. */
export async function reportFailure(user: UserDoc, orderId: string, reason?: string) {
    const res = await Payment.updateOne(
        { razorpayOrderId: orderId, userId: user.id, status: 'created' },
        { $set: { status: 'failed', failureReason: (reason || 'Payment failed').slice(0, 200) } },
    );
    const payment = await Payment.findOne({ razorpayOrderId: orderId, userId: user.id });
    if (!payment) throw new HttpError(404, 'Payment not found');
    return { status: payment.status, updated: res.modifiedCount > 0 };
}

/** Razorpay server la irundhu varum. App close aagi irundhaalum panam wallet ku serum. */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!razorpay.verifyWebhookSignature(rawBody, signature)) throw new HttpError(400, 'Invalid signature');

    let event: any;
    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch {
        throw new HttpError(400, 'Invalid payload');
    }
    const pay = event?.payload?.payment?.entity;
    const orderId: string | undefined = event?.payload?.order?.entity?.id ?? pay?.order_id;

    if ((event.event === 'payment.captured' || event.event === 'order.paid') && orderId && pay?.id) {
        const known = await Payment.exists({ razorpayOrderId: orderId });
        if (known) await settle(orderId, pay.id);
    } else if (event.event === 'payment.failed' && orderId) {
        await Payment.updateOne(
            { razorpayOrderId: orderId, status: 'created' },
            { $set: { status: 'failed', failureReason: String(pay?.error_description || 'Payment failed').slice(0, 200) } },
        );
    }
}