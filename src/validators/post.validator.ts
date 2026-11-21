import { z } from 'zod';

const postTypes = ['HELP', 'SOCIAL', 'STORIES', 'TRUE_EVENTS'] as const;

export const createPostSchema = z.object({
    type: z.enum(postTypes),
    title: z.string().trim().max(150).optional(),
    content: z.string().trim().min(1).max(5000),
    media: z.array(z.object({ type: z.enum(['image', 'video']), uri: z.string().url().max(600) })).max(5).optional(),
    hashtags: z.array(z.string().trim().regex(/^#?[A-Za-z0-9_]{1,30}$/)).max(10).optional(),
    isAnonymous: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    price: z.number().int().min(1).max(5000).optional(), // rupees
});

export const postListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    type: z.enum(postTypes).optional(),
});