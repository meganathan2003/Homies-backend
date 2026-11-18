import { UserModel, type UserDoc } from '../../models/user.model';
import { Identity, resolveIdentity } from '../../services/identity.service';
import { conflict, forbidden, notFound, unauthorized, unavailable } from '../../utils/errors';
import { generateAnonymousAlias, generateHomieId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { duplicateKeyFields } from '../../utils/mongoErrors';
import { signAuthToken } from '../../utils/token';
import { resolveCatalogNames } from '../catalog/catalog.service';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schemas';

const MAX_ID_ATTEMPTS = 5;

export async function registerMember(input: RegisterInput): Promise<{ user: UserDoc; token: string }> {
    // Email and uid come from the verified identity, never from the request body.
    const identity = await resolveIdentity({ idToken: input.idToken, email: input.email });

    for (let attempt = 1; attempt <= MAX_ID_ATTEMPTS; attempt++) {
        try {
            const user = await UserModel.create({
                email: identity.email,
                firebaseUid: identity.uid,
                role: 'member', // always. A client can never choose its own role.
                homiesId: generateHomieId(),
                dob: input.dob,
                mobileNumber: input.mobileNumber,
                country: input.country,
                state: input.state,
                city: input.city,
                profession: input.profession,
                typeOfWork: input.typeOfWork,
                workTiming: input.workTiming,
                purposeOfJoining: input.purposeOfJoining ?? null,
            });
            return { user, token: signAuthToken(user.id) };
        } catch (err) {
            const fields = duplicateKeyFields(err);
            if (!fields) throw err;
            // The unique INDEX is the real guard: it also stops two simultaneous requests for one email.
            if (fields.includes('email') || fields.includes('firebaseUid')) {
                throw conflict('User already registered. Please login.');
            }
            // homieId / anonymousAlias clashed with another user: generate fresh ones and try again.
            logger.warn('Generated ID collided, retrying', { fields, attempt });
        }
    }
    throw unavailable('Could not create your account right now. Please try again.');
}

export async function loginUser(input: LoginInput): Promise<{ user: UserDoc; token: string }> {
    const identity = await resolveIdentity({ idToken: input.idToken, email: input.email });

    // dob / mobileNumber are select:false, so ask for them explicitly (the user sees their own data).
    let user = await UserModel.findOne({ firebaseUid: identity.uid }).select('+dob +mobileNumber');
    if (!user) user = await bindProvisionedStaff(identity); // first login of an expert/admin created by us
    if (!user) throw notFound('User not found');

    return { user, token: signAuthToken(user.id) };
}


/**
 * An expert/admin account made by the seed script or an admin has an email but no Firebase uid yet.
 * The first login with that VERIFIED email claims it. Only staff without a uid can be claimed
 * (never a member), and the single atomic update means two simultaneous logins can't both claim it.
 */
async function bindProvisionedStaff(identity: Identity) {
    return UserModel.findOneAndUpdate(
        { email: identity.email, role: { $ne: 'member' }, firebaseUid: { $exists: false } },
        { $set: { firebaseUid: identity.uid } },
        { new: true },
    ).select('+dob +mobileNumber');
}

// update the profile code
export async function getOwnProfile(userId: string): Promise<UserDoc> {
    const user = await UserModel.findById(userId).select('+dob +mobileNumber');
    if (!user) throw unauthorized('Invalid or expired token');
    return user;
}

export async function updateOwnProfile(userId: string, input: UpdateProfileInput): Promise<UserDoc> {


    // Build $set from ONLY the fields that were sent, so the other list is never wiped.
    const set: { helps?: string[]; interests?: string[] } = {};


    // Only names that exist in the catalog are accepted (and stored with their official spelling).
    if (input.helps != null) set.helps = await resolveCatalogNames('help', input.helps);
    if (input.interests != null) set.interests = await resolveCatalogNames('interest', input.interests);

    // One atomic update (not load -> modify -> save), so two quick calls can't overwrite each other.
    const user = await UserModel.findByIdAndUpdate(userId, { $set: set }, { new: true, runValidators: true }).select('+dob +mobileNumber',);
    if (!user) throw unauthorized('Invalid or expired token');
    return user;
}