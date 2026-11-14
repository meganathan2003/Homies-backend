import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from './errors';


const ISSUER = 'homies-api';
const ALGORITHM = 'HS256';


/** so token carries only  the userid annd we will check the role and status in db for everytime so a suspended user or a demoted admin is blocked immediately, even if they still hold a valid token. */

export function signAuthToken(userId: string): string {
    return jwt.sign({}, env.JWT_SECRET, {
        subject: userId,
        issuer: ISSUER,
        algorithm: ALGORITHM,
        expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
}


// verify the token

export function verifyToken(token: string): string {

    try {
        const payload = jwt.verify(token, env.JWT_SECRET, {
            algorithms: [ALGORITHM],
            issuer: ISSUER
        });
        if (typeof payload === 'string' || !payload.sub) throw new Error('Missing Subject')
        return payload.sub;
    }
    catch {
        throw unauthorized('Invalid or expired Token')
    }
}