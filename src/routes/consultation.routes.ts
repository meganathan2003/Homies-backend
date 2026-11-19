import { Router } from 'express';
import * as c from '../controllers/consultation.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { startConsultationSchema } from '../validators/consultation.validator';

const router = Router();
router.use(requireAuth);

router.post('/', paymentLimiter, validate(startConsultationSchema), c.start);
router.get('/', c.listMine);
router.post('/:id/complete', requireRole('expert'), c.complete);

export default router;