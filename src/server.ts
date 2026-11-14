import http from 'node:http';
import { env } from './config/env';
import { connectDb, disconnectDb } from './config/db';
import { createApp } from './app';
import { createSocketServer } from './sockets';
import { logger } from './utils/logger';

async function main() {
    try {
        await connectDb(env.MONGODB_URI);
    } catch (err) {
        logger.error('Cannot connect to MongoDB. Is it running? (docker compose up -d mongo)', {
            uri: env.MONGODB_URI.replace(/\/\/[^@]*@/, '//***@'),
            error: err instanceof Error ? err.message : String(err),
        });
        process.exit(1);
    }

    const app = createApp();
    const server = http.createServer(app);
    const io = createSocketServer(server);

    server.listen(env.PORT, () => {
        logger.info('Homies API listening', { port: env.PORT, env: env.NODE_ENV });
    });

    let shuttingDown = false;
    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info('Shutting down', { signal });
        const force = setTimeout(() => process.exit(1), 10_000);
        force.unref();
        io.close();
        server.close();
        await disconnectDb();
        process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: reason instanceof Error ? reason.stack : String(reason) });
});

void main();