import { Router } from 'express';
import * as c from '../controllers/payment.controller';
import { requireAuth, requireVerified } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { topupFailureSchema } from '../validators/wallet.validator';

const router = Router();
// Public (Razorpay call pannum). Security: signature check.
router.post('/webhook', c.webhook);
// Edha payment fail aanaalum app idha call pannalam
router.post('/failure', requireAuth, requireVerified, validate(topupFailureSchema), c.failure);

export default router;