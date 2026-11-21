import { Router } from 'express';
import * as c from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { markReadSchema } from '../validators/notification.validator';

const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.post('/read', validate(markReadSchema), c.markRead);

export default router;