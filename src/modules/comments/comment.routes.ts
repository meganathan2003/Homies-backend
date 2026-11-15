import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { list, create, toggleLike } from './comment.controller';

export const commentsRouter = Router();

commentsRouter.get('/comments', requireAuth, list);
commentsRouter.post('/comments', requireAuth, create);
commentsRouter.post('/comments/:id/toggle-like', requireAuth, toggleLike);
