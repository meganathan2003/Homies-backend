import { Router } from 'express';
import * as c from '../controllers/media.controller';
import { requireAuth } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();
// requireAuth munnadi: login illaadhavanga temp file kooda create panna koodaadhu
router.post('/multiple', requireAuth, uploadMedia, c.uploadMultiple);
export default router;