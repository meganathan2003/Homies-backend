import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { firebaseAuth } from '../config/firebase';
import { LOGIN_PURPOSES, PurposeKey } from '../constants/loginPurpose';
import { User, UserDoc } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newHomieCode, newId } from '../utils/id';

export type TokenPayload = { sub: string; role: string };

export type RegisterInput = {
    idToken: string;
    firstName: string;
    dob?: string;
    city: string;
    state: string;
    country: string;
    mobileNumber: string;
    profession: string;
    workTiming?: string;
    typeOfWork: string;
};

export function issueToken(user: Pick<UserDoc, 'id' | 'role'>): string {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
}

export function verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

type Identity = { email: string; name: string; uid?: string };

/** Firebase ID token verify pannum. Fail aana eppavum 401. */
export async function resolveIdentity(idToken: string): Promise<Identity> {
    // Dev only: "dev:someone@example.com" nu anuppina Firebase illama test pannalam
    if (env.devAuthBypass && !env.isProd && idToken.startsWith('dev:')) {
        const email = idToken.slice(4).trim().toLowerCase();
        if (!email.includes('@')) throw new HttpError(401, 'Invalid dev token');
        return { email, name: email.split('@')[0] };
    }

    try {
        const decoded = await firebaseAuth().verifyIdToken(idToken);
        const email = decoded.email?.toLowerCase();
        if (!email || !decoded.email_verified) throw new Error('email not verified');
        if (decoded.firebase?.sign_in_provider !== 'google.com') throw new Error('not a Google sign-in');
        return { email, name: (decoded.name as string) || email.split('@')[0], uid: decoded.uid };
    } catch {
        throw new HttpError(401, 'Invalid or expired sign-in token');
    }
}

async function uniqueHomieId(): Promise<string> {
    let code = newHomieCode();
    while (await User.exists({ homieId: code })) code = newHomieCode();
    return code;
}

/** Public register. Role eppavum 'user'. Expert/admin ah yaarum thaane aaga mudiyaadhu. */
export async function register(input: RegisterInput) {
    const ident = await resolveIdentity(input.idToken);
    if (await User.exists({ email: ident.email })) throw new HttpError(409, 'Email already registered');

    const user = await User.create({
        id: newId('usr'),
        homieId: await uniqueHomieId(),
        email: ident.email,
        firebaseUid: ident.uid,
        firstName: input.firstName,
        dob: input.dob,
        city: input.city,
        state: input.state,
        country: input.country,
        mobileNumber: input.mobileNumber,
        profession: input.profession,
        workTiming: input.workTiming,
        typeOfWork: input.typeOfWork,
        role: 'user',
        lastLoginAt: new Date(),
    });
    return { user, token: issueToken(user) };
}

export async function login(idToken: string) {
    const ident = await resolveIdentity(idToken);
    let user = await User.findOne({ email: ident.email });

    // Admin: server config la irukkura ADMIN_EMAILS list la irundha mattum
    const isAdminEmail = env.adminEmails.includes(ident.email);
    if (!user && isAdminEmail) {
        user = await User.create({
            id: newId('usr'),
            homieId: await uniqueHomieId(),
            email: ident.email,
            firstName: ident.name,
            role: 'admin',
        });
    }
    if (!user) throw new HttpError(404, 'User not found');
    if (isAdminEmail && user.role !== 'admin') user.role = 'admin';
    if (user.isBlocked) throw new HttpError(403, 'Account is blocked');

    // Firebase uid first login la bind aagum. Appuram vera account use panna mudiyaadhu.
    if (ident.uid) {
        if (user.firebaseUid && user.firebaseUid !== ident.uid) throw new HttpError(401, 'Account mismatch');
        user.firebaseUid = ident.uid;
    }
    user.lastLoginAt = new Date();
    await user.save();
    return { user, token: issueToken(user) };
}

/** "Why are you here?" answer save panni, entha screen ku poganum nu return pannum. */
export async function setPurpose(user: UserDoc, purpose: PurposeKey) {
    user.lastPurpose = purpose;
    await user.save();
    return { purpose, ...LOGIN_PURPOSES[purpose] };
}