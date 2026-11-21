import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';
import { fail } from '../utils/response';
import { MulterError } from 'multer';

export const notFound = (_req: Request, res: Response) => fail(res, 404, 'Route not found');

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {


    if (err instanceof HttpError) return fail(res, err.status, err.message, err.code);
    
    if (err instanceof ZodError) {
        return fail(res, 400, err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '));
    }

    if (err instanceof MulterError) {
        const msg =
            err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 50 MB)'
                : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Send 1 to 5 files in the "files" field'
                    : err.message;
        return fail(res, 400, msg);
    }



    console.error(err);
    return fail(res, 500, env.isProd ? 'Internal server error' : String((err as Error)?.message || err));
}