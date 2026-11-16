import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { experts, startConv, conversations, messages } from './chat.controller';

export const usersRouter = Router();
export const chatRouter = Router();

// GET /api/users/experts  — member sees expert directory
usersRouter.get('/users/experts', requireAuth, experts);

// POST /api/chats/conversations        — member starts/finds a conversation with an expert
// GET  /api/chats/conversations        — member or expert lists their conversations
// GET  /api/chats/conversations/:id/messages — participant fetches message history
chatRouter.post('/chats/conversations', requireAuth, requireRole('member'), startConv);
chatRouter.get('/chats/conversations', requireAuth, requireRole('member', 'expert'), conversations);
chatRouter.get('/chats/conversations/:id/messages', requireAuth, requireRole('member', 'expert'), messages);
