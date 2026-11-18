import { Router } from 'express';
import { isDbConnected } from '../../config/db';
import { APP_NAME, APP_VERSION } from '../../config/constants';
import { fail, ok } from '../../utils/response';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
    const connected = isDbConnected();
    const data = {
        status: connected ? 'ok' : 'degraded',
        service: APP_NAME,
        version: APP_VERSION,
        database: connected ? 'connected' : 'disconnected',
        uptimeSeconds: Math.round(process.uptime()),
        time: new Date().toISOString(),
    };
    if (!connected) {
        fail(res, 503, 'Database is not connected', data);
        return;
    }
    ok(res, data);
});