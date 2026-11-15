import { z } from 'zod';

export const createCommentSchema = z.object({
    postId: z.string().min(1, 'postId is required'),
    content: z.string().min(1, 'Content is required').max(1000),
    parentCommentId: z.string().optional(), // omit for top-level, provide for reply
});

export const commentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(5),
    postId: z.string().optional(),
    commentId: z.string().optional(), // fetch replies for this comment
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentQuery = z.infer<typeof commentQuerySchema>;
