import { Socket } from 'socket.io';
import * as chatService from '../services/chat.service';

type Ack = (res: { ok: boolean; message?: string; data?: unknown }) => void;

// Spam thadukka: oru socket 10 second la 20 messages mattum
function makeLimiter(max = 20, windowMs = 10_000) {
    let count = 0;
    let resetAt = Date.now() + windowMs;
    return () => {
        const now = Date.now();
        if (now > resetAt) { count = 0; resetAt = now + windowMs; }
        return ++count <= max;
    };
}

export function registerChatHandlers(socket: Socket) {
    const user = socket.data.user as { id: string; role: string; firstName: string };
    const allow = makeLimiter();

    socket.on('join_chat', async (payload: { conversationId?: string }, ack?: Ack) => {
        try {
            await chatService.assertParticipant(user.id, String(payload?.conversationId || ''));
            ack?.({ ok: true });
        } catch (e) {
            ack?.({ ok: false, message: (e as Error).message });
        }
    });

    socket.on('send_message', async (payload: { conversationId?: string; text?: string }, ack?: Ack) => {
        if (!allow()) return ack?.({ ok: false, message: 'Too many messages, slow down' });
        try {
            const msg = await chatService.sendMessage(user.id, String(payload?.conversationId || ''), String(payload?.text || ''));
            ack?.({ ok: true, data: msg });
        } catch (e) {
            ack?.({ ok: false, message: (e as Error).message });
        }
    });
}