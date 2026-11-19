import { Conversation } from '../models/conversation.model';
import { ExpertProfile } from '../models/expertProfile.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';
import { emitToUser } from '../sockets';

function toMessageDto(m: { id: string; conversationId: string; senderId: string; text: string; createdAt: Date }) {
    return { id: m.id, conversationId: m.conversationId, senderId: m.senderId, text: m.text, createdAt: m.createdAt };
}

/** Participant illaadhavanga ku 404 (conversation irukkunu kooda kaatta koodaadhu). */
export async function assertParticipant(userId: string, conversationId: string) {
    const conv = await Conversation.findOne({ id: conversationId, $or: [{ userId }, { expertId: userId }] });
    if (!conv) throw new HttpError(404, 'Conversation not found');
    return conv;
}

export async function listConversations(userId: string) {
    const convs = await Conversation.find({ $or: [{ userId }, { expertId: userId }] })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .limit(100);
    const otherIds = convs.map((c) => (c.userId === userId ? c.expertId : c.userId));
    const [users, profiles] = await Promise.all([
        User.find({ id: { $in: otherIds } }),
        ExpertProfile.find({ userId: { $in: otherIds } }),
    ]);
    const uMap = new Map(users.map((u) => [u.id, u]));
    const pMap = new Map(profiles.map((p) => [p.userId, p]));

    return convs.map((c) => {
        const otherId = c.userId === userId ? c.expertId : c.userId;
        const u = uMap.get(otherId);
        const p = pMap.get(otherId);
        return {
            id: c.id,
            consultationId: c.consultationId,
            status: c.status,
            lastMessage: c.lastMessage,
            lastMessageAt: c.lastMessageAt,
            other: { id: otherId, firstName: u?.firstName, role: u?.role, photo: p?.photo, availability: p?.availability },
        };
    });
}

export async function getMessages(userId: string, conversationId: string, limit: number, before?: Date) {
    await assertParticipant(userId, conversationId);
    const filter: Record<string, unknown> = { conversationId };
    if (before) filter.createdAt = { $lt: before };
    const items = await Message.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = items.length > limit;
    return { messages: items.slice(0, limit).map(toMessageDto), hasMore }; // newest first
}

export async function sendMessage(senderId: string, conversationId: string, rawText: string) {
    const text = rawText.trim();
    if (!text) throw new HttpError(400, 'Message cannot be empty');
    if (text.length > 2000) throw new HttpError(400, 'Message is too long (max 2000 characters)');

    const conv = await assertParticipant(senderId, conversationId);
    if (conv.status !== 'active') throw new HttpError(403, 'This consultation has ended');

    const msg = await Message.create({ id: newId('msg'), conversationId, senderId, text });
    await Conversation.updateOne({ id: conversationId }, { $set: { lastMessage: text.slice(0, 200), lastMessageAt: msg.createdAt } });

    const dto = toMessageDto(msg);
    const otherId = conv.userId === senderId ? conv.expertId : conv.userId;
    emitToUser(otherId, 'new_message', dto);
    return dto;
}