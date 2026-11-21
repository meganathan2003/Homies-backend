import { z } from 'zod';

export const createCommentSchema = z.object({
    postId: z.string().min(3),
    content: z.string().trim().min(1).max(2000),
    parentCommentId: z.string().min(3).nullish(),
});

export const commentListQuerySchema = z
    .object({
        postId: z.string().min(3).optional(),
        commentId: z.string().min(3).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(5),
    })
    .refine((q) => !!q.postId !== !!q.commentId, { message: 'Send either postId or commentId' });