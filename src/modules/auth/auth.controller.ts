import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { toSelfDto } from '../users/user.mapper';
import { loginSchema, registerSchema } from './auth.schemas';
import { loginUser, registerMember } from './auth.service';

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