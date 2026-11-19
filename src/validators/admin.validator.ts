import { z } from 'zod';

export const createExpertSchema = z.object({
    email: z.string().trim().email(),
    firstName: z.string().trim().min(1).max(60),
    includedInMembership: z.boolean().optional(),
});

export const setExpertStatusSchema = z
    .object({
        status: z.enum(['pending', 'approved', 'suspended']).optional(),
        includedInMembership: z.boolean().optional(),
    })
    .refine((b) => b.status !== undefined || b.includedInMembership !== undefined, {
        message: 'Send status or includedInMembership',
    });

export const adminExpertListSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['pending', 'approved', 'suspended']).optional(),
});