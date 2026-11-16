import { z } from 'zod';

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const startConversationSchema = z.object({
    expertId: z.string().min(1, 'expertId is required'),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type StartConversationInput = z.infer<typeof startConversationSchema>;
