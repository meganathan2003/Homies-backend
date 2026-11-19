import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';
import { messagesQuerySchema } from '../validators/chat.validator';
import { ok } from '../utils/response';

export async function conversations(req: Request, res: Response) {
    return ok(res, { conversations: await chatService.listConversations(req.user!.id) });
}

export async function messages(req: Request, res: Response) {
    const q = messagesQuerySchema.parse(req.query);
    const data = await chatService.getMessages(req.user!.id, String(req.params.id), q.limit, q.before ? new Date(q.before) : undefined);
    return ok(res, data);
}

export async function send(req: Request, res: Response) {
    const msg = await chatService.sendMessage(req.user!.id, String(req.params.id), req.body.text);
    return ok(res, msg, 'Message sent', 201);
}