import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit';
import { login, profile, register, updateProfile } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

export const authRouter = Router();


authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.get('/profile', requireAuth, profile);
authRouter.put('/update-profile', requireAuth, updateProfile);