import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { env, isProd } from '../config/env';
import { logger } from '../utils/logger';
import { verifyAuthToken } from '../utils/token';
import { UserModel } from '../models/user.model';
import { ConversationModel } from '../models/conversation.model';
import { MessageModel } from '../models/message.model';
import { startAutoCompleteJob } from './chat.job';

// ─── JWT handshake ────────────────────────────────────────────────────────────

async function authenticate(socket: Socket): Promise<string | null> {
    try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return null;
        const userId = verifyAuthToken(token);
        const user = await UserModel.findById(userId).select('status');
        if (!user || user.status !== 'active') return null;
        return userId;
    } catch {
        return null;
    }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Resolve conversation id regardless of whether the client sent a string or { conversationId } */
function resolveConvId(raw: unknown): string | null {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && 'conversationId' in raw) {
        return String((raw as { conversationId: unknown }).conversationId);
    }
    return null;
}

/** Check that userId is a participant (member or expert) of the conversation */
async function isParticipant(convId: string, userId: string): Promise<boolean> {
    const conv = await ConversationModel.findById(convId).select('member expert').lean();
    if (!conv) return false;
    return String(conv.member) === userId || String(conv.expert) === userId;
}

// ─── socket server ────────────────────────────────────────────────────────────

export function createSocketServer(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : !isProd,
        },
    });

    // Map userId → Set of socket ids (a user may have multiple tabs/devices)
    const onlineUsers = new Map<string, Set<string>>();

    // ── middleware: JWT auth ──────────────────────────────────────────────────
    io.use(async (socket, next) => {
        const userId = await authenticate(socket);
        if (!userId) {
            next(new Error('Unauthorized'));
            return;
        }
        socket.data.userId = userId;
        next();
    });

    io.on('connection', async (socket) => {
        const userId = socket.data.userId as string;
        logger.info('socket connected', { id: socket.id, userId });

        // Track online presence
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        onlineUsers.get(userId)!.add(socket.id);

        // Update isOnline flag for experts in DB
        await UserModel.updateOne(
            { _id: userId, role: 'expert' },
            { $set: { 'expertProfile.isOnline': true, lastSeenAt: new Date() } },
        );

        // Notify shared-conversation partners that this user is online
        await broadcastPresence(io, userId, 'online', onlineUsers);

        // ── join_chat ─────────────────────────────────────────────────────────
        // Android sends a plain string room id here (PDF note)
        socket.on('join_chat', async (raw: unknown) => {
            const convId = resolveConvId(raw);
            if (!convId) return;
            if (!(await isParticipant(convId, userId))) {
                socket.emit('error', { message: 'Not a participant of this conversation' });
                return;
            }
            await socket.join(convId);
            logger.info('joined chat room', { userId, convId });
        });

        // ── leave_room ────────────────────────────────────────────────────────
        // Android sends { conversationId } here (PDF note)
        socket.on('leave_room', async (raw: unknown) => {
            const convId = resolveConvId(raw);
            if (!convId) return;
            await socket.leave(convId);
            logger.info('left chat room', { userId, convId });
        });

        // ── send_message ──────────────────────────────────────────────────────
        socket.on('send_message', async (payload: {
            convId: string;
            message: string;
            receiver_id: string;
            sender_id: string;
            sender_details?: unknown;
            receiver_detail?: unknown;
        }) => {
            const { convId, message, receiver_id, sender_details, receiver_detail } = payload;

            const conv = await ConversationModel.findById(convId);
            if (!conv) return;

            // Reject if conversation is completed (PDF rule)
            if (conv.status === 'completed') {
                socket.emit('error', { message: 'This conversation is completed.' });
                return;
            }

            // Only participants can send
            if (!(await isParticipant(convId, userId))) return;

            // Persist the message
            const saved = await MessageModel.create({
                conversation: convId,
                sender: userId,
                receiver: receiver_id,
                message,
                senderDetails: sender_details ?? null,
                receiverDetail: receiver_detail ?? null,
            });

            // Update last message + activity on the conversation
            await ConversationModel.updateOne(
                { _id: convId },
                { $set: { lastMessage: message, lastActivityAt: new Date() } },
            );

            const msgObj = {
                id: saved.id as string,
                convId,
                message: saved.message,
                sender: userId,
                receiver: receiver_id,
                createdAt: saved.createdAt,
            };

            // ── emit to room ──────────────────────────────────────────────────
            // receive_message: primary event
            io.to(convId).emit('receive_message', msgObj);

            // message:new: kept for Android compatibility (PDF spec)
            io.to(convId).emit('message:new', msgObj);

            // chat:update: sent to both participants (even if not in room)
            const updatePayload = { convId, lastMessage: message };
            const memberId = String(conv.member);
            const expertId = String(conv.expert);
            emitToUser(io, onlineUsers, memberId, 'chat:update', updatePayload);
            emitToUser(io, onlineUsers, expertId, 'chat:update', updatePayload);
        });

        // ── disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', async () => {
            logger.info('socket disconnected', { id: socket.id, userId });
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    // Mark expert as offline in DB
                    await UserModel.updateOne(
                        { _id: userId, role: 'expert' },
                        { $set: { 'expertProfile.isOnline': false, lastSeenAt: new Date() } },
                    );
                    await broadcastPresence(io, userId, 'offline', onlineUsers);
                }
            }
        });
    });

    // Start the background job that auto-completes idle conversations
    startAutoCompleteJob(env.CONVERSATION_AUTO_COMPLETE_HOURS);

    return io;
}

// ─── presence helpers ─────────────────────────────────────────────────────────

/** Emit status_change to all online users who share a conversation with targetUserId */
async function broadcastPresence(
    io: Server,
    targetUserId: string,
    status: 'online' | 'offline',
    onlineUsers: Map<string, Set<string>>,
) {
    // Find all conversations this user is in
    const convs = await ConversationModel.find({
        $or: [{ member: targetUserId }, { expert: targetUserId }],
    }).select('member expert').lean();

    const partnerIds = new Set<string>();
    for (const c of convs) {
        const m = String(c.member);
        const e = String(c.expert);
        if (m !== targetUserId) partnerIds.add(m);
        if (e !== targetUserId) partnerIds.add(e);
    }

    const payload = { userId: targetUserId, status };
    for (const partnerId of partnerIds) {
        emitToUser(io, onlineUsers, partnerId, 'status_change', payload);
    }
}

/** Emit an event to all socket connections for a given userId */
function emitToUser(
    io: Server,
    onlineUsers: Map<string, Set<string>>,
    userId: string,
    event: string,
    payload: unknown,
) {
    const sockets = onlineUsers.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
        io.to(socketId).emit(event, payload);
    }
}
