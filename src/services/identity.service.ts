import { env, isProd } from '../config/env';
import { unauthorized } from '../utils/errors';
import { logger } from '../utils/logger';
import { verifyFirebaseIdToken } from './firebase';


// create the interface for who is verify the firbase
export interface Identity {
    uid: string;
    email: string;
    provider:
    'google.com'
    | 'password'
    | 'dev';
}


export async function resolveIdentity(input: { idToken?: string; email?: string; }): Promise<Identity> {

    // for dev no token allowed only in dev 
    if (!input.idToken) {
        if (!isProd && env.ALLOW_UNVERIFIED_GOOGLE_LOGIN && input.email) {
            const email = input.email.trim().toLowerCase();
            return { uid: `dev:${email}`, email, provider: 'dev' };
        }
        throw unauthorized('idToken is required');
    }

    let decoded;
    try {
        decoded = await verifyFirebaseIdToken(input.idToken);

    } catch (err) {
        logger.warn('Firebase token verification failed', {
            reason: err instanceof Error ? err.message : String(err),
        });
        throw unauthorized('Invalid or expired token');
    }

    const email = decoded.email?.trim().toLowerCase();
    if (!email) throw unauthorized('Token has no email');

    const provider = decoded.firebase?.sign_in_provider;
    if (provider === 'google.com') {
        if (!decoded.email_verified) throw unauthorized('Email is not verified');
        return { uid: decoded.uid, email, provider };
    }
    // Email/password users exist only to test with Postman. Never accepted in production.
    if (provider === 'password' && !isProd) {
        return { uid: decoded.uid, email, provider };
    }
    throw unauthorized('Unsupported sign-in method');
}