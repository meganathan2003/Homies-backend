import { NextFunction, Request, Response } from 'express';
import { Role, User } from '../models/user.model';
import { verifyToken } from '../services/auth.service';
import { HttpError } from '../utils/httpError';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const header = req.header('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new HttpError(401, 'Authentication required');

    let payload;
    try {
        payload = verifyToken(token);
    } catch {
        throw new HttpError(401, 'Invalid or expired token');
    }

    const user = await User.findOne({ id: payload.sub });
    if (!user) throw new HttpError(401, 'User no longer exists');
    if (user.isBlocked) throw new HttpError(403, 'Account is blocked');
    req.user = user;
    next();
}

export const requireRole =
    (...roles: Role[]) =>
        (req: Request, _res: Response, next: NextFunction) => {
            if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, 'Forbidden');
            next();
        };