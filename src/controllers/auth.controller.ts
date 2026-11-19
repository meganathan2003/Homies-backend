import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service';
import { ok } from '../utils/response';
import { HttpError } from '../utils/httpError';

export async function register(req: Request, res: Response) {
    const { user, token } = await authService.register(req.body);
    return ok(res, { token, user: userService.toPublicUser(user) }, 'User registered successfully', 201);
}

export async function login(req: Request, res: Response) {
    const { user, token } = await authService.login(req.body.idToken);
    return ok(res, { token, user: userService.toPublicUser(user) }, 'Login successful');
}

export async function setPurpose(req: Request, res: Response) {
    const result = await authService.setPurpose(req.user!, req.body.purpose);
    return ok(res, result);
}

export async function me(req: Request, res: Response) {
    return ok(res, userService.toPublicUser(req.user!));
}

export async function updateProfile(req: Request, res: Response) {
    const user = await userService.updateProfile(req.user!, req.body);
    return ok(res, userService.toPublicUser(user));
}

/** Android compatibility ku mattum. Face verified nu server thaane decide pannum, client flag ah nambaadhu. */
export async function updateVerification(req: Request, res: Response) {
    if (req.body.id !== req.user!.id) throw new HttpError(403, 'Forbidden');
    if (!req.user!.isImageVerified) throw new HttpError(400, 'Face verification not completed');
    return ok(res, undefined, 'Verification updated');
}