import { env } from '../config/env';
import { Consultation } from '../models/consultation.model';
import { Conversation } from '../models/conversation.model';
import { ExpertProfile } from '../models/expertProfile.model';
import { User, UserDoc } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';
import { emitToUser } from '../sockets';
import * as credits from './credit.service';
import * as wallet from './wallet.service';
import { IPayment } from '../models/payment.model';

/** Fee ah split pannum. Rounding: expert share kila round, meethi Homies ku. */
export function splitFee(feePaise: number, expertPercent: number) {
    const expertShare = Math.floor((feePaise * expertPercent) / 100);
    return { expertShare, platformShare: feePaise - expertShare };
}

type ConsultationDoc = InstanceType<typeof Consultation>;

export function toConsultationDto(c: ConsultationDoc) {
    return {
        id: c.id,
        userId: c.userId,
        expertId: c.expertId,
        conversationId: c.conversationId,
        fee: wallet.toRupees(c.feePaise),
        paidBy: c.paidBy,
        status: c.status,
        startedAt: c.startedAt,
        completedAt: c.completedAt,
    };
}

/** Payment mudinja piragu thaan chat open aagum: free credit (member) illa wallet la irundhu fee debit. */
export async function start(user: UserDoc, expertUserId: string) {
    if (user.id === expertUserId) throw new HttpError(400, 'You cannot consult yourself');

    const [expertUser, profile] = await Promise.all([
        User.findOne({ id: expertUserId, role: 'expert', isBlocked: false }),
        ExpertProfile.findOne({ userId: expertUserId }),
    ]);
    if (!expertUser || !profile || profile.status !== 'approved') throw new HttpError(404, 'Expert not available');

    const existing = await Consultation.findOne({ userId: user.id, expertId: expertUserId, status: 'active' });
    if (existing) return { consultation: existing, alreadyActive: true };

    // 1) Member ku free credit, 2) illa na wallet payment
    let creditId: string | null = null;
    if (profile.includedInMembership) creditId = await credits.consume(user.id);
    const paidBy: 'wallet' | 'credit' = creditId ? 'credit' : 'wallet';
    const fee = profile.feePaise;

    if (paidBy === 'wallet') {
        await wallet.debit(user.id, fee, {
            reason: 'consultation', refType: 'expert', refId: expertUserId, description: `Consultation with ${expertUser.firstName}`,
        });
    }

    // Free credit chat ku expert share 0 (decision pending)
    const { expertShare, platformShare } = paidBy === 'wallet' ? splitFee(fee, env.expertSharePercent) : { expertShare: 0, platformShare: 0 };
    const consultationId = newId('con');
    const conversationId = newId('cnv');

    try {
        const consultation = await Consultation.create({
            id: consultationId, userId: user.id, expertId: expertUserId, conversationId, feePaise: fee, paidBy,
            expertSharePaise: expertShare, platformSharePaise: platformShare,
        });
        await Conversation.create({ id: conversationId, consultationId, userId: user.id, expertId: expertUserId });
        emitToUser(expertUserId, 'consultation_started', {
            consultationId, conversationId, userId: user.id, userName: user.firstName,
        });
        return { consultation, alreadyActive: false };
    } catch (err) {
        // Edhavathu fail aana panam / credit thirumba kudukkanum
        await Consultation.deleteOne({ id: consultationId }).catch(() => undefined);
        if (paidBy === 'wallet') {
            await wallet.credit(user.id, fee, {
                reason: 'refund', refType: 'consultation_failed', refId: consultationId, description: 'Consultation could not start',
            });
        } else if (creditId) {
            await credits.refund(creditId);
        }
        if ((err as { code?: number }).code === 11000) {
            const again = await Consultation.findOne({ userId: user.id, expertId: expertUserId, status: 'active' });
            if (again) return { consultation: again, alreadyActive: true };
        }
        throw err;
    }
}

/** Expert session mudikkum. Appo thaan expert ku 60% wallet la serum. */
export async function complete(expert: UserDoc, consultationId: string) {
    const c = await Consultation.findOneAndUpdate(
        { id: consultationId, expertId: expert.id, status: 'active' },
        { $set: { status: 'completed', completedAt: new Date() } },
        { new: true },
    );
    if (!c) {
        const done = await Consultation.findOne({ id: consultationId, expertId: expert.id });
        if (!done) throw new HttpError(404, 'Consultation not found');
        return done; // already completed: safe, thirumba pay aagaadhu
    }

    await Conversation.updateOne({ id: c.conversationId }, { $set: { status: 'closed' } });
    if (c.expertSharePaise > 0) {
        await wallet.credit(c.expertId, c.expertSharePaise, {
            reason: 'consultation_earning', refType: 'consultation', refId: c.id, description: 'Consultation earning',
        });
    }
    await Consultation.updateOne({ id: c.id }, { $set: { settled: true } });
    emitToUser(c.userId, 'consultation_completed', { consultationId: c.id, conversationId: c.conversationId });
    return c;
}

export async function listMine(user: UserDoc, status?: 'active' | 'completed') {
    const filter: Record<string, unknown> = { $or: [{ userId: user.id }, { expertId: user.id }] };
    if (status) filter.status = status;
    const items = await Consultation.find(filter).sort({ startedAt: -1 }).limit(100);
    return items.map(toConsultationDto);
}


/** Direct Razorpay (UPI, card...) payment ku munnadi: expert available ah, already active chat illa nu check. */
export async function assertBookable(user: UserDoc, expertUserId: string) {
    if (user.id === expertUserId) throw new HttpError(400, 'You cannot consult yourself');
    const [expertUser, profile] = await Promise.all([
        User.findOne({ id: expertUserId, role: 'expert', isBlocked: false }),
        ExpertProfile.findOne({ userId: expertUserId }),
    ]);
    if (!expertUser || !profile || profile.status !== 'approved') throw new HttpError(404, 'Expert not available');
    if (await Consultation.exists({ userId: user.id, expertId: expertUserId, status: 'active' })) {
        throw new HttpError(409, 'You already have an active consultation with this expert', 'ALREADY_ACTIVE');
    }
    return { expertUser, profile };
}

export async function findByPayment(paymentId: string) {
    return Consultation.findOne({ paymentId });
}

/** Razorpay payment success aana piragu consultation start. Verify and webhook rendum vandhaalum oru thadavai mattum create aagum. */
export async function startFromPayment(payment: Pick<IPayment, 'id' | 'userId' | 'refId' | 'amount'>) {
    const existing = await Consultation.findOne({ paymentId: payment.id });
    if (existing) return existing;

    const expertUserId = payment.refId!;
    const { expertShare, platformShare } = splitFee(payment.amount, env.expertSharePercent);
    const user = await User.findOne({ id: payment.userId });
    const consultationId = newId('con');
    const conversationId = newId('cnv');

    try {
        const consultation = await Consultation.create({
            id: consultationId, userId: payment.userId, expertId: expertUserId, conversationId,
            feePaise: payment.amount, paidBy: 'razorpay', paymentId: payment.id,
            expertSharePaise: expertShare, platformSharePaise: platformShare,
        });
        await Conversation.create({ id: conversationId, consultationId, userId: payment.userId, expertId: expertUserId });
        emitToUser(expertUserId, 'consultation_started', {
            consultationId, conversationId, userId: payment.userId, userName: user?.firstName,
        });
        return consultation;
    } catch (err) {
        await Consultation.deleteOne({ id: consultationId }).catch(() => undefined);
        const again = await Consultation.findOne({ paymentId: payment.id });
        if (again) return again; // rendu paths ore neram: onnu jeychuduchu

        if ((err as { code?: number }).code === 11000) {
            // Already active chat irukku (rendu thadavai pay pannirukkaanga): panam wallet ku thirumba
            await wallet.credit(payment.userId, payment.amount, {
                reason: 'refund', refType: 'payment_refund', refId: payment.id, description: 'Consultation was already active',
            });
            return null;
        }
        throw err; // payment fulfill retry aagum, refund pannaadhu
    }
}