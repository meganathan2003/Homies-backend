import type { RequestHandler } from 'express';
import { logger } from '../utils/logger';

export const requestLogger: RequestHandler = (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        logger.info('request', {
            method: req.method,
            path: req.originalUrl.split('?')[0],
            status: res.statusCode,
            ms: Math.round(ms),
        });
    });
    next();
};