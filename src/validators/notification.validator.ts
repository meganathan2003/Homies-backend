import { z } from 'zod';

export const notificationListSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const markReadSchema = z.object({
    ids: z.array(z.string().min(3)).max(100).optional(),
});