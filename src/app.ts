import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, isProd } from './config/env';
import { healthRouter } from './modules/health/health.routes';
import { apiRouter } from './routes';
import { apiLimiter } from './middleware/rateLimit';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
    const app = express();

    app.disable('x-powered-by');
    // Behind a reverse proxy (nginx / load balancer) in production, so client IPs are read correctly.
    if (isProd) app.set('trust proxy', 1);

    app.use(helmet());
    app.use(
        cors({
            // Mobile apps and curl send no Origin header: always allowed.
            // Browsers (admin panel) must be in CORS_ORIGINS; in development an empty list allows all.
            origin: (origin, cb) => {
                if (!origin) return cb(null, true);
                if (env.CORS_ORIGINS.length === 0) return cb(null, !isProd);
                return cb(null, env.CORS_ORIGINS.includes(origin));
            },
        }),
    );
    // Large enough for the base64 selfie sent to /verification/image (M3).
    app.use(express.json({ limit: '15mb' }));
    app.use(requestLogger);

    app.use('/health', healthRouter);
    app.use('/api', apiLimiter, apiRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}