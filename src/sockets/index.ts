import http from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { User } from '../models/user.model';
import { verifyToken } from '../services/auth.service';
import { registerChatHandlers } from './chat.socket';
import { setAvailability } from '../services/expert.service';

let io: Server | null = null;
const onlineCounts = new Map<string, number>(); // userId -> open sockets (single server instance)

export function initSockets(server: http.Server): Server {
    io = new Server(server, {
        cors: { origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins },
        maxHttpBufferSize: 100_000,
    });

    // Token illama / thappaa irundhaa connect aagaadhu
    io.use(async (socket, next) => {
        try {
            const raw = (socket.handshake.auth?.token as string | undefined) || socket.handshake.headers.authorization || '';
            const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
            if (!token) return next(new Error('Authentication required'));
            const payload = verifyToken(token);
            const user = await User.findOne({ id: payload.sub });
            if (!user || user.isBlocked) return next(new Error('Unauthorized'));
            socket.data.user = { id: user.id, role: user.role, firstName: user.firstName };
            next();
        } catch {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', async (socket) => {
        const { id, role } = socket.data.user as { id: string; role: string };
        socket.join(`user:${id}`);

        if (role === 'expert') {
            const n = (onlineCounts.get(id) ?? 0) + 1;
            onlineCounts.set(id, n);
            if (n === 1) {
                await setAvailability(id, 'online').catch(() => undefined);
                io?.emit('expert_status', { expertId: id, availability: 'online' });
            }
        }

        registerChatHandlers(socket);

        socket.on('disconnect', async () => {
            if (role !== 'expert') return;
            const n = (onlineCounts.get(id) ?? 1) - 1;
            if (n <= 0) {
                onlineCounts.delete(id);
                await setAvailability(id, 'offline').catch(() => undefined);
                io?.emit('expert_status', { expertId: id, availability: 'offline' });
            } else {
                onlineCounts.set(id, n);
            }
        });
    });

    return io;
}

/** Oru user oda ella devices ku event anuppum. Socket start aagala na silent ah vittudum. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
    io?.to(`user:${userId}`).emit(event, payload);
}