import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getHashtags, getHelps, getInterests } from './catalog.controller';

export const catalogRouter = Router();

catalogRouter.get('/helps', requireAuth, getHelps);
catalogRouter.get('/interests', requireAuth, getInterests);
catalogRouter.get('/hashtags', requireAuth, getHashtags);