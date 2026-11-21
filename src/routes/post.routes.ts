import { Router } from 'express';
import * as c from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth';
import { contentLimiter, paymentLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { createPostSchema } from '../validators/post.validator';
import { verifyTopupSchema } from '../validators/wallet.validator';

const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.post('/', contentLimiter, validate(createPostSchema), c.create);
router.get('/:id', c.getOne);
router.delete('/:id', c.remove);
router.post('/:id/toggle-like', c.toggleLike);
router.post('/:id/unlock', paymentLimiter, c.unlock); // wallet
router.post('/:id/unlock/order', paymentLimiter, c.unlockOrder); // UPI / card
router.post('/:id/unlock/verify', paymentLimiter, validate(verifyTopupSchema), c.unlockVerify);

export default router;