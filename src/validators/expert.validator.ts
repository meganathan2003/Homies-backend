import { z } from 'zod';

export const profileSchema = z.object({
    photo: z.string().url().max(500).optional(),
    qualifications: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
    experience: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(1000).optional(),
    fee: z.number().int().min(1).max(100000).optional(), // rupees
});

export const availabilitySchema = z.object({
    availability: z.enum(['online', 'offline']),
});

export const expertListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    online: z.enum(['true', 'false']).optional(),
});