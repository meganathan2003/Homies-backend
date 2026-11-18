import type { Request, RequestHandler } from 'express';
import { isObjectIdOrHexString } from 'mongoose';
import { UserModel, type UserDoc, type UserRole } from '../models/user.model';
import { forbidden, unauthorized } from '../utils/errors';
import { verifyAuthToken } from '../utils/token';


/**
 * Protects a route. Flow: "Authorization: Bearer <jwt>" -> verify -> load user from DB -> req.user.
 * The DB is hit on EVERY request on purpose: suspended users and role changes apply immediately.
 */

export const requireAuth: RequestHandler = async (req, _res, next) => {
    const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '');
    if (!match) throw unauthorized('Authentication required');

    const userId = verifyAuthToken(match[1]!.trim());
    if (!isObjectIdOrHexString(userId)) throw unauthorized('Invalid or expired token');

    const user = await UserModel.findById(userId);
    if (!user) throw unauthorized('Invalid or expired token'); // deleted user: same message, no hints
    if (user.status !== 'active') throw forbidden('Your account is suspended');

    req.user = user;
    next();
};

/** Use AFTER requireAuth. Example: router.delete('/x', requireAuth, requireRole('admin'), handler) */
export function requireRole(...roles: UserRole[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) throw forbidden('You do not have access to this');
        next();
    };
}

/** The logged-in user. Throws if requireAuth did not run (a programming mistake, never a client mistake). */
export function authUser(req: Request): UserDoc {
    if (!req.user) throw unauthorized('Authentication required');
    return req.user;
}