import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as storage from '../services/storage.service';
import { HttpError } from '../utils/httpError';
import { ok } from '../utils/response';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** File content nijama andha type ah nu first bytes la paakkum (mime header ah mattum nambaadhu). */
async function contentMatches(filePath: string, mime: string): Promise<boolean> {
    const fh = await fs.promises.open(filePath, 'r');
    const b = Buffer.alloc(12);
    await fh.read(b, 0, 12, 0);
    await fh.close();
    if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    if (mime === 'image/png') return b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (mime === 'image/webp') return b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
    if (mime === 'video/mp4') return b.toString('ascii', 4, 8) === 'ftyp';
    return false;
}

export async function uploadMultiple(req: Request, res: Response) {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) throw new HttpError(400, 'At least one file is required in the "files" field');

    try {
        for (const f of files) {
            if (!(await contentMatches(f.path, f.mimetype))) throw new HttpError(400, 'File content does not match its type');
            if (f.mimetype.startsWith('image/') && f.size > MAX_IMAGE_BYTES) throw new HttpError(400, 'Images must be 8 MB or smaller');
        }
        const result: Array<{ url: string; mimetype: string; filename: string }> = [];
        for (const f of files) {
            const filename = path.basename(f.path);
            const url = await storage.saveFile(f.path, `uploads/${req.user!.id}/${filename}`, f.mimetype);
            result.push({ url, mimetype: f.mimetype, filename });
        }
        return ok(res, { files: result });
    } catch (err) {
        await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => undefined)));
        throw err;
    }
}