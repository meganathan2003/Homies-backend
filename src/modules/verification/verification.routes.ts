import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { faceLimiter } from '../../middleware/rateLimit';
import { verifyImage } from './verification.controller';

export const verificationRouter = Router();

// requireAuth first, so faceLimiter can count attempts per user.
verificationRouter.post('/verification/image', requireAuth, faceLimiter, verifyImage);