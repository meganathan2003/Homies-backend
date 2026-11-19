import { Request, Response } from 'express';
import * as expertService from '../services/expert.service';
import { expertListQuerySchema } from '../validators/expert.validator';
import { ok } from '../utils/response';

export async function list(req: Request, res: Response) {
    const q = expertListQuerySchema.parse(req.query);
    return ok(res, await expertService.listApproved(q.page, q.limit, q.online === 'true'));
}

export async function getOne(req: Request, res: Response) {
    return ok(res, await expertService.getApproved(String(req.params.id)));
}

export async function getMyProfile(req: Request, res: Response) {
    return ok(res, await expertService.getMyProfile(req.user!));
}

export async function updateMyProfile(req: Request, res: Response) {
    return ok(res, await expertService.updateMyProfile(req.user!, req.body), 'Profile updated');
}

export async function setMyAvailability(req: Request, res: Response) {
    return ok(res, await expertService.setMyAvailability(req.user!, req.body.availability));
}