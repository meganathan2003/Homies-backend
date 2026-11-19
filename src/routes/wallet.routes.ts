import { Router } from 'express';
import * as c from '../controllers/wallet.controller';
import { requireAuth } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { topupFailureSchema, topupOrderSchema, verifyTopupSchema } from '../validators/wallet.validator';

const router = Router();
router.use(requireAuth);

router.get('/', c.getWallet);
router.get('/transactions', c.transactions);
router.post('/topup/order', paymentLimiter, validate(topupOrderSchema), c.createTopupOrder);
router.post('/topup/verify', paymentLimiter, validate(verifyTopupSchema), c.verifyTopup);
router.post('/topup/failure', validate(topupFailureSchema), c.reportFailure);

export default router;