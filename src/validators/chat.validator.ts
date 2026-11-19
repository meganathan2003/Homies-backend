import { z } from 'zod';

export const sendMessageSchema = z.object({
    text: z.string().min(1).max(2000),
});

export const messagesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    before: z.string().datetime().optional(), // ISO date: ithukku munnaadi irukkura messages
});