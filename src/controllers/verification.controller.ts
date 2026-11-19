import { Request, Response } from 'express';
import * as faceService from '../services/face.service';
import { ok } from '../utils/response';

export async function verifyImage(req: Request, res: Response) {
    const result = await faceService.analyze(req.body.image);
    if (result.verified) {
        req.user!.isImageVerified = true; // server thaane set pannum
        await req.user!.save();
    }
    return ok(res, result);
}