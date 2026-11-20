import { Availability, ExpertProfile, ExpertStatus } from '../models/expertProfile.model';
import { User, UserDoc } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newHomieCode, newId } from '../utils/id';
import { toRupees } from './wallet.service';

type ProfileDoc = InstanceType<typeof ExpertProfile>;

export function toExpertCard(user: { id: string; firstName: string }, p: ProfileDoc) {
    return {
        id: user.id,
        firstName: user.firstName,
        photo: p.photo,
        qualifications: p.qualifications,
        experience: p.experience,
        bio: p.bio,
        fee: toRupees(p.feePaise),
        feePaise: p.feePaise,
        availability: p.availability,
        includedInMembership: p.includedInMembership,
    };
}

/** Expert ku thanoda full record (status kooda). */
export function toMyProfile(user: { id: string; firstName: string }, p: ProfileDoc) {
    return { ...toExpertCard(user, p), status: p.status };
}

export async function setAvailability(userId: string, availability: Availability) {
    await ExpertProfile.updateOne({ userId }, { $set: { availability } });
}

export async function getMyProfile(user: UserDoc) {
    const p = await ExpertProfile.findOne({ userId: user.id });
    if (!p) throw new HttpError(404, 'Expert profile not found');
    return toMyProfile(user, p);
}

export async function updateMyProfile(
    user: UserDoc,
    patch: { photo?: string; qualifications?: string[]; experience?: string; bio?: string; fee?: number },
) {
    const p = await ExpertProfile.findOne({ userId: user.id });
    if (!p) throw new HttpError(404, 'Expert profile not found');
    if (patch.photo !== undefined) p.photo = patch.photo;
    if (patch.qualifications !== undefined) p.qualifications = patch.qualifications;
    if (patch.experience !== undefined) p.experience = patch.experience;
    if (patch.bio !== undefined) p.bio = patch.bio;
    if (patch.fee !== undefined) p.feePaise = patch.fee * 100;
    await p.save();
    return toMyProfile(user, p);
}

export async function setMyAvailability(user: UserDoc, availability: Availability) {
    const p = await ExpertProfile.findOneAndUpdate({ userId: user.id }, { $set: { availability } }, { returnDocument: "after" });
    if (!p) throw new HttpError(404, 'Expert profile not found');
    return toMyProfile(user, p);
}

/** Users ku approved experts mattum. */
export async function listApproved(page: number, limit: number, onlineOnly: boolean) {
    const filter: Record<string, unknown> = { status: 'approved' };
    if (onlineOnly) filter.availability = 'online';
    const [profiles, total] = await Promise.all([
        ExpertProfile.find(filter).sort({ availability: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
        ExpertProfile.countDocuments(filter),
    ]);
    const users = await User.find({ id: { $in: profiles.map((p) => p.userId) }, isBlocked: false });
    const byId = new Map(users.map((u) => [u.id, u]));
    const experts = profiles.flatMap((p) => {
        const u = byId.get(p.userId);
        return u ? [toExpertCard(u, p)] : [];
    });
    return { experts, page, limit, total, hasMore: page * limit < total };
}

export async function getApproved(expertUserId: string) {
    const [u, p] = await Promise.all([
        User.findOne({ id: expertUserId, role: 'expert', isBlocked: false }),
        ExpertProfile.findOne({ userId: expertUserId, status: 'approved' }),
    ]);
    if (!u || !p) throw new HttpError(404, 'Expert not found');
    return toExpertCard(u, p);
}

// ---------- Admin ----------

export async function adminCreateExpert(input: { email: string; firstName: string; includedInMembership?: boolean }) {
    const email = input.email.trim().toLowerCase();
    let user = await User.findOne({ email });
    if (user && user.role === 'admin') throw new HttpError(409, 'This email belongs to an admin');
    if (user && user.role === 'expert' && (await ExpertProfile.exists({ userId: user.id }))) {
        throw new HttpError(409, 'Expert already exists');
    }

    if (user && user.role !== 'expert') {
        user.role = 'expert'; // already irukkura normal user ah expert ah maathuraanga
        await user.save();
    } else if (!user) {
        let homieId = newHomieCode();
        while (await User.exists({ homieId })) homieId = newHomieCode();
        user = await User.create({ id: newId('usr'), homieId, email, firstName: input.firstName, role: 'expert' });
    }
    const profile = await ExpertProfile.findOneAndUpdate(
        { userId: user.id },
        { $setOnInsert: { userId: user.id, status: 'pending', includedInMembership: input.includedInMembership ?? false } },
        { upsert: true, returnDocument: 'after' },
    );
    return { email, ...toMyProfile(user, profile!) };
}

export async function adminSetStatus(
    expertUserId: string,
    patch: { status?: ExpertStatus; includedInMembership?: boolean },
) {
    const [u, p] = await Promise.all([
        User.findOne({ id: expertUserId, role: 'expert' }),
        ExpertProfile.findOne({ userId: expertUserId }),
    ]);
    if (!u || !p) throw new HttpError(404, 'Expert not found');
    if (patch.status === 'approved' && p.feePaise <= 0) throw new HttpError(400, 'Expert has not set a fee yet');
    if (patch.status) p.status = patch.status;
    if (patch.includedInMembership !== undefined) p.includedInMembership = patch.includedInMembership;
    if (p.status !== 'approved') p.availability = 'offline';
    await p.save();
    return { email: u.email, ...toMyProfile(u, p) };
}

export async function adminList(status: ExpertStatus | undefined, page: number, limit: number) {
    const filter = status ? { status } : {};
    const [profiles, total] = await Promise.all([
        ExpertProfile.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        ExpertProfile.countDocuments(filter),
    ]);
    const users = await User.find({ id: { $in: profiles.map((p) => p.userId) } });
    const byId = new Map(users.map((u) => [u.id, u]));
    const experts = profiles.flatMap((p) => {
        const u = byId.get(p.userId);
        return u ? [{ email: u.email, ...toMyProfile(u, p) }] : [];
    });
    return { experts, page, limit, total, hasMore: page * limit < total };
}