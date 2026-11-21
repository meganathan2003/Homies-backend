import { Router } from 'express';
import * as c from '../controllers/consultation.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { startConsultationSchema } from '../validators/consultation.validator';
import { verifyTopupSchema } from '../validators/wallet.validator';

const router = Router();
router.use(requireAuth);

router.post('/', paymentLimiter, validate(startConsultationSchema), c.start); // free credit / wallet
router.post('/order', paymentLimiter, validate(startConsultationSchema), c.createOrder); // UPI / card
router.post('/verify', paymentLimiter, validate(verifyTopupSchema), c.verify);
router.get('/', c.listMine);
router.post('/:id/complete', requireRole('expert'), c.complete);

export default router;