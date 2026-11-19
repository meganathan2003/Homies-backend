import { Router } from 'express';
import * as c from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '../validators/chat.validator';

const router = Router();
router.use(requireAuth);

router.get('/conversations', c.conversations);
router.get('/conversations/:id/messages', c.messages);
router.post('/conversations/:id/messages', validate(sendMessageSchema), c.send);

export default router;