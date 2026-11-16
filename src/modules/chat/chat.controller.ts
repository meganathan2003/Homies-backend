import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { authUser } from '../../middleware/auth';
import { paginationSchema, startConversationSchema } from './chat.schemas';
import { getMessages, listConversations, listExperts, startConversation } from './chat.service';

export async function experts(req: Request, res: Response) {
    const query = paginationSchema.parse(req.query);
    const result = await listExperts(query);
    ok(res, result);
}

export async function startConv(req: Request, res: Response) {
    const input = startConversationSchema.parse(req.body);
    const user = authUser(req);
    const conv = await startConversation(input, user.id);
    ok(res, conv, 'Conversation started', 201);
}

export async function conversations(req: Request, res: Response) {
    const query = paginationSchema.parse(req.query);
    const user = authUser(req);
    const result = await listConversations(query, user.id, user.role);
    ok(res, result);
}

export async function messages(req: Request, res: Response) {
    const query = paginationSchema.parse(req.query);
    const user = authUser(req);
    const result = await getMessages(String(req.params.id), user.id, query);
    ok(res, result);
}
