import { ConsultationCredit } from '../models/consultationCredit.model';

/** Membership free consultation credit ah (irundha) 1 use pannum. Credit id return pannum, illa na null. */
export async function consume(userId: string): Promise<string | null> {
    const c = await ConsultationCredit.findOneAndUpdate(
        { userId, remaining: { $gt: 0 }, expiresAt: { $gt: new Date() } },
        { $inc: { remaining: -1 } },
        { sort: { expiresAt: 1 }, new: true }, // mudiya pora credit mudhalla
    );
    return c ? String(c._id) : null;
}

export async function refund(creditId: string): Promise<void> {
    await ConsultationCredit.updateOne({ _id: creditId }, { $inc: { remaining: 1 } });
}