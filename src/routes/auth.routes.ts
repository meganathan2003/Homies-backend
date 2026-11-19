// auth.routes.ts
import { Router } from 'express';
import * as c from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
    loginSchema,
    purposeSchema,
    registerSchema,
    updateProfileSchema,
    updateVerificationSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), c.register);
router.post('/login', authLimiter, validate(loginSchema), c.login);
router.post('/purpose', requireAuth, validate(purposeSchema), c.setPurpose);
router.get('/me', requireAuth, c.me);
router.put('/update-profile', requireAuth, validate(updateProfileSchema), c.updateProfile);
router.patch('/verification', requireAuth, validate(updateVerificationSchema), c.updateVerification);


export default router;