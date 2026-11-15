import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { authUser } from '../../middleware/auth';
import { createPostSchema, feedQuerySchema } from './post.schemas';
import { createPost, getFeed, getPostById, togglePostLike } from './post.service';

export async function feed(req: Request, res: Response) {
    const query = feedQuerySchema.parse(req.query);
    const result = await getFeed(query, authUser(req).id);
    ok(res, result);
}

export async function postDetail(req: Request, res: Response) {
    const post = await getPostById(String(req.params.id), authUser(req).id);
    ok(res, post); // data IS the post object (matches Android expectation)
}

export async function create(req: Request, res: Response) {
    const input = createPostSchema.parse(req.body);
    const user = authUser(req);
    const post = await createPost(input, user.id, user.role);
    ok(res, post, 'Post created successfully', 201);
}

export async function toggleLike(req: Request, res: Response) {
    const result = await togglePostLike(String(req.params.id), authUser(req).id);
    ok(res, result);
}
