import { Router } from 'express';
import * as c from '../controllers/verification.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { verifyImageSchema } from '../validators/verification.validator';

const router = Router();
router.post('/image', requireAuth, validate(verifyImageSchema), c.verifyImage);
export default router;