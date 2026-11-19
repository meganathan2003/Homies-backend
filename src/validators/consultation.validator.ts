import { z } from 'zod';

export const startConsultationSchema = z.object({
    expertId: z.string().min(3),
});

export const consultationListSchema = z.object({
    status: z.enum(['active', 'completed']).optional(),
});