import type { Request, Response } from 'express';
import { authUser } from '../../middleware/auth';
import { ok } from '../../utils/response';
import { verifyImageSchema } from './verification.schemas';
import { verifyFace } from './verification.service';

export async function verifyImage(req: Request, res: Response) {
    const { image } = verifyImageSchema.parse(req.body);
    ok(res, await verifyFace(authUser(req), image));
}
