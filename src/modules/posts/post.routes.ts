import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { feed, postDetail, create, toggleLike } from './post.controller';

export const postsRouter = Router();

postsRouter.get('/posts', requireAuth, feed);
postsRouter.get('/posts/:id', requireAuth, postDetail);
postsRouter.post('/posts', requireAuth, create);
postsRouter.post('/posts/:id/toggle-like', requireAuth, toggleLike);
