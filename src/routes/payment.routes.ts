import { Router } from 'express';
import * as c from '../controllers/payment.controller';

const router = Router();
// Public (Razorpay call pannum). Security: signature check.
router.post('/webhook', c.webhook);

export default router;