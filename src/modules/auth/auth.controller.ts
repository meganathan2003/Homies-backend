import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { toSelfDto } from '../users/user.mapper';
import { getOwnProfile, loginUser, registerMember, updateOwnProfile } from './auth.service';
import { authUser } from '../../middleware/auth';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schemas';

export async function register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerMember(input);
    ok(res, { token, user: toSelfDto(user) }, 'User registered successfully', 201);
}

export async function login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginUser(input);
    ok(res, { token, user: toSelfDto(user) }, 'Login successful');
}


// Always the CALLER's own profile, taken from the token. The ?userId= query the app sends is ignored,
// otherwise anyone could read anyone's profile just by changing that id.
export async function profile(req: Request, res: Response) {
    const user = await getOwnProfile(authUser(req).id);
    ok(res, toSelfDto(user)); // `data` is the user object itself (what the Android app expects)
}

export async function updateProfile(req: Request, res: Response) {
    const input = updateProfileSchema.parse(req.body);
    const user = await updateOwnProfile(authUser(req).id, input);
    ok(res, toSelfDto(user), 'Profile updated successfully');
}