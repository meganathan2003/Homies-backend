import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit';
import { login, register } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);