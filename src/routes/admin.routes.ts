import { Router } from 'express';
import * as c from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createExpertSchema, setExpertStatusSchema } from '../validators/admin.validator';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.post('/experts', validate(createExpertSchema), c.createExpert);
router.get('/experts', c.listExperts);
router.patch('/experts/:id/status', validate(setExpertStatusSchema), c.setExpertStatus);

export default router;