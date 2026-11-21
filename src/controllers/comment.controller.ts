import { Request, Response } from 'express';
import * as commentService from '../services/comment.service';
import { commentListQuerySchema } from '../validators/comment.validator';
import { ok } from '../utils/response';

export async function list(req: Request, res: Response) {
    return ok(res, await commentService.list(req.user!, commentListQuerySchema.parse(req.query)));
}

export async function create(req: Request, res: Response) {
    return ok(res, await commentService.create(req.user!, req.body), 'Comment added', 201);
}

export async function remove(req: Request, res: Response) {
    await commentService.remove(req.user!, String(req.params.id));
    return ok(res, undefined, 'Comment deleted');
}

export async function toggleLike(req: Request, res: Response) {
    return ok(res, await commentService.toggleLike(req.user!, String(req.params.id)));
}