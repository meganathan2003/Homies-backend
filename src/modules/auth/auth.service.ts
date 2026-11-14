import { UserModel, type UserDoc } from '../../models/user.model';
import { resolveIdentity } from '../../services/identity.service';
import { conflict, forbidden, notFound, unavailable } from '../../utils/errors';
import { generateAnonymousAlias, generateHomieId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { duplicateKeyFields } from '../../utils/mongoErrors';
import { signAuthToken } from '../../utils/token';
import type { LoginInput, RegisterInput } from './auth.schemas';

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
    const user = await UserModel.findOne({ firebaseUid: identity.uid }).select('+dob +mobileNumber');
    if (!user) throw notFound('User not found');
    if (user.status !== 'active') throw forbidden('Your account is suspended');

    return { user, token: signAuthToken(user.id) };
}