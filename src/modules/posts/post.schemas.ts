import { z } from 'zod';
import { POST_TYPES } from '../../models/post.model';

export const createPostSchema = z.object({
    type: z.enum(POST_TYPES),
    content: z.string().min(1, 'Content is required').max(2000),
    mediaUrls: z.array(z.url()).max(5).default([]),
    hashtags: z
        .array(z.string().min(1))
        .max(10)
        .default([])
        .transform((tags) => tags.map((t) => t.replace(/^#/, '').trim().toLowerCase())),
});

export const feedQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    type: z.enum(POST_TYPES).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
