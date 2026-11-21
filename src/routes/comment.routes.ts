import { Router } from 'express';
import * as c from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth';
import { contentLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../validators/comment.validator';

const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.post('/', contentLimiter, validate(createCommentSchema), c.create);
router.delete('/:id', c.remove);
router.post('/:id/toggle-like', c.toggleLike);

export default router;