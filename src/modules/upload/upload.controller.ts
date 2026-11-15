import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { authUser } from '../../middleware/auth';
import { uploadMultiple, type IncomingFile } from './upload.service';

// multer attaches files to req.files as Express.Multer.File[]
// We re-shape them into our own IncomingFile type to keep the service clean of multer internals.
function toIncomingFiles(raw: Express.Multer.File[]): IncomingFile[] {
    return raw.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        buffer: f.buffer,
        size: f.size,
    }));
}

export async function uploadMultipleFiles(req: Request, res: Response) {
    const user = authUser(req);
    const rawFiles = (req.files as Express.Multer.File[] | undefined) ?? [];
    const files = toIncomingFiles(rawFiles);
    const result = await uploadMultiple(files, user.id);
    ok(res, { files: result }, 'Files uploaded successfully', 201);
}
