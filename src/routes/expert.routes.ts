import { Router } from 'express';
import * as c from '../controllers/expert.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { availabilitySchema, profileSchema } from '../validators/expert.validator';

const router = Router();
router.use(requireAuth);

// /me routes munnadi irukkanum (illana "me" ah :id nu eduthukkum)
router.get('/me/profile', requireRole('expert'), c.getMyProfile);
router.put('/me/profile', requireRole('expert'), validate(profileSchema), c.updateMyProfile);
router.patch('/me/status', requireRole('expert'), validate(availabilitySchema), c.setMyAvailability);

router.get('/', c.list);
router.get('/:id', c.getOne);

export default router;