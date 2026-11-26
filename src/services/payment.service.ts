import { env } from '../config/env';
import { IPayment, Payment, PaymentPurpose } from '../models/payment.model';
import { UserDoc } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';
import * as consultationService from './consultation.service';
import * as postService from './post.service';
import * as razorpay from './razorpay.service';
import * as wallet from './wallet.service';

type CheckoutInput = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

/** Razorpay order create. Android Razorpay Checkout open pannum bodhu UPI, card, netbanking ellam kaattum. */
export async function createCheckoutOrder(user: UserDoc, purpose: PaymentPurpose, amountPaise: number, refId?: string) {
    const paymentId = newId('pay');
    const order = await razorpay.createOrder(amountPaise, paymentId, {
        userId: user.id, paymentId, purpose, ...(refId ? { refId } : {}),
    });
    await Payment.create({
        id: paymentId, userId: user.id, purpose, refId, amount: amountPaise, currency: 'INR',
        razorpayOrderId: order.id, status: 'created',
    });
    return {
        paymentId,
        orderId: order.id,
        amount: amountPaise, // paise (Razorpay checkout ku idhaiye kudukkanum)
        currency: 'INR',
        keyId: env.razorpay.keyId || 'rzp_test_mock',
    };
}

export const createTopupOrder = (user: UserDoc, amountInr: number) =>
    createCheckoutOrder(user, 'wallet_topup', amountInr * 100);

export async function createConsultationOrder(user: UserDoc, expertUserId: string) {
    const { expertUser, profile } = await consultationService.assertBookable(user, expertUserId);
    const order = await createCheckoutOrder(user, 'consultation', profile.feePaise, expertUserId);
    return { ...order, expert: { id: expertUserId, firstName: expertUser.firstName, fee: wallet.toRupees(profile.feePaise) } };
}

export async function createStoryOrder(user: UserDoc, postId: string) {
    const post = await postService.assertUnlockable(user, postId);
    return createCheckoutOrder(user, 'story_unlock', post.pricePaise, postId);
}

/** Panam vandha piragu enna seyyanum: wallet credit / chat open / story unlock. Ovvoru velaiyum idempotent. */
async function fulfill(p: IPayment) {
    if (p.purpose === 'wallet_topup') {
        await wallet.credit(p.userId, p.amount, { reason: 'topup', refType: 'payment', refId: p.id, description: 'Wallet top-up' });
    } else if (p.purpose === 'consultation') {
        await consultationService.startFromPayment(p);
    } else if (p.purpose === 'story_unlock') {
        await postService.unlockFromPayment(p);
    }
}

/**
 * 1) Payment ah 'paid' nu mark pannum  2) velai oru thadavai mattum nadakka claim pannum  3) fulfill.
 * Verify, webhook rendum idhaiye use pannum. Server crash aanaalum 2 nimisham aprm thirumba try aagum.
 */
async function settle(orderId: string, paymentId: string, signature?: string) {
    await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $in: ['created', 'failed'] } },
        { $set: { status: 'paid', razorpayPaymentId: paymentId, razorpaySignature: signature, paidAt: new Date() }, $unset: { failureReason: '' } },
    );
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) throw new HttpError(404, 'Payment not found');
    if (payment.status !== 'paid') throw new HttpError(409, 'Payment not completed');
    if (payment.fulfilledAt) return { payment, fulfilledNow: false, processing: false };

    const stale = new Date(Date.now() - 2 * 60 * 1000);
    const mine = await Payment.findOneAndUpdate(
        { id: payment.id, fulfilledAt: null, $or: [{ fulfillStartedAt: null }, { fulfillStartedAt: { $lt: stale } }] },
        { $set: { fulfillStartedAt: new Date() } },
        { new: true },
    );
    if (!mine) return { payment, fulfilledNow: false, processing: true }; // vera request velai senjitu irukku

    try {
        await fulfill(mine);
    } catch (err) {
        await Payment.updateOne({ id: mine.id }, { $unset: { fulfillStartedAt: '' } }); // udane thirumba try pannalam
        throw err;
    }
    const done = await Payment.findOneAndUpdate({ id: mine.id }, { $set: { fulfilledAt: new Date() } }, { new: true });
    return { payment: done!, fulfilledNow: true, processing: false };
}

/** Client anuppina signature check + settle. purpose match aaganum. */
async function verify(user: UserDoc, input: CheckoutInput, purpose: PaymentPurpose, refId?: string) {

    const payment = await Payment.findOne({
        razorpayOrderId: input.razorpay_order_id, userId: user.id, purpose, ...(refId ? { refId } : {}),
    });

    if (!payment) throw new HttpError(404, 'Payment not found');
    if (!razorpay.verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
        throw new HttpError(400, 'Payment verification failed');
    }
    return settle(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature);
}

export async function verifyTopup(user: UserDoc, input: CheckoutInput) {
    const r = await verify(user, input, 'wallet_topup');
    return { status: r.payment.status, credited: r.fulfilledNow, balancePaise: await wallet.getBalancePaise(user.id) };
}

export async function verifyConsultation(user: UserDoc, input: CheckoutInput) {
    const r = await verify(user, input, 'consultation');
    const consultation = r.payment.fulfilledAt ? await consultationService.findByPayment(r.payment.id) : null;
    return { consultation, processing: !consultation, alreadyProcessed: !r.fulfilledNow };
}

export async function verifyStoryUnlock(user: UserDoc, input: CheckoutInput, postId: string) {
    const r = await verify(user, input, 'story_unlock', postId);
    return { unlocked: !!r.payment.fulfilledAt, processing: !r.payment.fulfilledAt, alreadyProcessed: !r.fulfilledNow, storyId: r.payment.refId };
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

/** Razorpay server la irundhu varum. App close aagi irundhaalum wallet credit / chat open / story unlock nadakkum. */
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