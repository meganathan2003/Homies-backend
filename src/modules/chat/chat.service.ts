import { isObjectIdOrHexString } from 'mongoose';
import { UserModel } from '../../models/user.model';
import { ConversationModel } from '../../models/conversation.model';
import { MessageModel } from '../../models/message.model';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import type { PaginationQuery, StartConversationInput } from './chat.schemas';

// ─── Expert directory ────────────────────────────────────────────────────────

export async function listExperts(query: PaginationQuery) {
    const filter: Record<string, unknown> = { role: 'expert', status: 'active' };
    const total = await UserModel.countDocuments(filter);
    const pages = Math.ceil(total / query.limit) || 1;

    const experts = await UserModel.find(filter)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean();

    return {
        list: experts.map((u) => ({
            id: String(u._id),
            name: u.name ?? '',
            profession: u.profession ?? '',
            isImageVerified: u.isImageVerified,
            expertProfile: u.expertProfile
                ? {
                      bio: u.expertProfile.bio ?? null,
                      specialization: u.expertProfile.specialization ?? null,
                      qualifications: u.expertProfile.qualifications ?? [],
                      sessionFee: u.expertProfile.sessionFee ?? 0,
                      isOnline: u.expertProfile.isOnline ?? false,
                  }
                : null,
        })),
        pageMeta: { page: query.page, pages },
    };
}

// ─── Conversations ───────────────────────────────────────────────────────────

/**
 * Find an existing active conversation between this member and expert,
 * or create a new one. Members only — experts cannot initiate.
 */
export async function startConversation(input: StartConversationInput, memberId: string) {
    if (!isObjectIdOrHexString(input.expertId)) throw badRequest('Invalid expertId');

    const expert = await UserModel.findOne({ _id: input.expertId, role: 'expert', status: 'active' });
    if (!expert) throw notFound('Expert not found');

    // Find or create (atomic upsert so two simultaneous requests don't create duplicates)
    let conv = await ConversationModel.findOne({ member: memberId, expert: expert._id, status: 'active' });
    if (!conv) {
        conv = await ConversationModel.create({ member: memberId, expert: expert._id });
    }

    return toConversationDto(conv, memberId);
}

export async function listConversations(query: PaginationQuery, userId: string, userRole: string) {
    // Members see their own conversations; experts see conversations assigned to them.
    const filter =
        userRole === 'expert'
            ? { expert: userId }
            : { member: userId };

    const total = await ConversationModel.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit) || 1;

    const conversations = await ConversationModel.find(filter)
        .sort({ lastActivityAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate('expert', 'name profession status isImageVerified expertProfile') // member sees expert name
        .populate('member', 'homiesId status') // expert sees member homiesId only
        .lean();

    return {
        conversations: conversations.map((c) => toConversationListDto(c, userRole)),
        currentPage: query.page,
        totalPages,
    };
}

export async function getMessages(convId: string, userId: string, query: PaginationQuery) {
    if (!isObjectIdOrHexString(convId)) throw badRequest('Invalid conversation id');

    const conv = await ConversationModel.findById(convId);
    if (!conv) throw notFound('Conversation not found');

    // Only participants can read messages
    if (String(conv.member) !== userId && String(conv.expert) !== userId) {
        throw forbidden('You are not a participant of this conversation');
    }

    const total = await MessageModel.countDocuments({ conversation: convId });
    const messages = await MessageModel.find({ conversation: convId })
        .sort({ createdAt: -1 }) // newest first (PDF spec)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean();

    return messages;
}

// ─── DTO helpers ─────────────────────────────────────────────────────────────

function toConversationDto(conv: InstanceType<typeof ConversationModel>, _requesterId: string) {
    return {
        id: conv.id as string,
        status: conv.status,
        lastMessage: conv.lastMessage,
        lastActivityAt: conv.lastActivityAt,
        createdAt: conv.createdAt,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toConversationListDto(conv: any, viewerRole: string) {
    // expert_id must be a populated object { id, name, status } — never a plain string (PDF spec)
    const expertObj = conv.expert
        ? { id: String(conv.expert._id), name: conv.expert.name ?? '', status: conv.expert.status ?? 'active', profession: conv.expert.profession ?? '' }
        : null;

    // member: expert sees homiesId only; member sees their own homiesId
    const memberObj = conv.member
        ? { id: String(conv.member._id), homiesId: conv.member.homiesId ?? '' }
        : null;

    return {
        id: String(conv._id),
        status: conv.status,
        lastMessage: conv.lastMessage,
        lastActivityAt: conv.lastActivityAt,
        expert_id: expertObj,   // snake_case: matches Android model (PDF spec)
        member: viewerRole === 'expert' ? memberObj : undefined, // expert sees member's homiesId
        createdAt: conv.createdAt,
    };
}
