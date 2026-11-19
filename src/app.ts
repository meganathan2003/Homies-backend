import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import routes from './routes';
import { globalLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import path from 'node:path';

export const app = express();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', 1);


app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(globalLimiter);

// Selfie base64 ku periya limit, mathathu ku 1mb
app.use('/api/verification', express.json({ limit: '6mb' }));
// Razorpay webhook: signature check ku RAW body venum, so json parser ku munnadi
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

if (env.storage.driver === 'local') {
    app.use('/uploads', express.static(path.resolve('uploads'), { index: false }));
}

app.get('/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ ok: connected, service: 'homies-backend', time: new Date().toISOString() });
});


app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);