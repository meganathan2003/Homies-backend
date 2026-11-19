import { Request, Response } from 'express';
import * as expertService from '../services/expert.service';
import { adminExpertListSchema } from '../validators/admin.validator';
import { ok } from '../utils/response';

export async function createExpert(req: Request, res: Response) {
    return ok(res, await expertService.adminCreateExpert(req.body), 'Expert added', 201);
}

export async function listExperts(req: Request, res: Response) {
    const q = adminExpertListSchema.parse(req.query);
    return ok(res, await expertService.adminList(q.status, q.page, q.limit));
}

export async function setExpertStatus(req: Request, res: Response) {
    return ok(res, await expertService.adminSetStatus(String(req.params.id), req.body), 'Expert updated');
}