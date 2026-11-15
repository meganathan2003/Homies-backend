import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { authUser } from '../../middleware/auth';
import { commentQuerySchema, createCommentSchema } from './comment.schemas';
import { createComment, getComments, toggleCommentLike } from './comment.service';

export async function list(req: Request, res: Response) {
    const query = commentQuerySchema.parse(req.query);
    const result = await getComments(query, authUser(req).id);
    ok(res, result);
}

export async function create(req: Request, res: Response) {
    const input = createCommentSchema.parse(req.body);
    const comment = await createComment(input, authUser(req).id);
    ok(res, comment, 'Comment created successfully', 201);
}

export async function toggleLike(req: Request, res: Response) {
    const result = await toggleCommentLike(String(req.params.id), authUser(req).id);
    ok(res, result);
}
