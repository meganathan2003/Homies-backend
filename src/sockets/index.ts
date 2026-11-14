import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env, isProd } from '../config/env';
import { logger } from '../utils/logger';

export function createSocketServer(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : !isProd,
        },
    });

    io.on('connection', (socket) => {
        logger.info('socket connected', { id: socket.id });
        socket.on('disconnect', () => logger.info('socket disconnected', { id: socket.id }));
    });

    return io;
}