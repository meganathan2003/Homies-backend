import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { fail } from '../utils/response';
import { logger } from '../utils/logger';
import { isProd } from '../config/env';

export const notFoundHandler: RequestHandler = (req, res) => {
    fail(res, 404, `Route not found: ${req.method} ${req.path}`);
};

// Express identifies error middleware by its 4 arguments, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    if (res.headersSent) return;

    if (err instanceof AppError) {
        fail(res, err.status, err.message, err.details);
        return;
    }

    if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        fail(res, 400, issues[0] ? `${issues[0].path || 'body'}: ${issues[0].message}` : 'Invalid request', issues);
        return;
    }

    // Errors raised by body-parser (invalid JSON, payload too large) carry a status + type.
    const e = err as { status?: number; type?: string };
    if (e?.type === 'entity.parse.failed') {
        fail(res, 400, 'Invalid JSON body');
        return;
    }
    if (e?.type === 'entity.too.large') {
        fail(res, 413, 'Request body too large');
        return;
    }

    logger.error('Unhandled error', {
        method: req.method,
        path: req.path,
        error: err instanceof Error ? err.stack : String(err),
    });
    fail(res, 500, isProd ? 'Internal server error' : err instanceof Error ? err.message : 'Internal server error');
};