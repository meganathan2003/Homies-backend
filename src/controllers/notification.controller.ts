import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { notificationListSchema } from '../validators/notification.validator';
import { ok } from '../utils/response';

export async function list(req: Request, res: Response) {
    const q = notificationListSchema.parse(req.query);
    return ok(res, await notificationService.list(req.user!.id, q.page, q.limit));
}

export async function markRead(req: Request, res: Response) {
    return ok(res, await notificationService.markRead(req.user!.id, req.body.ids));
}