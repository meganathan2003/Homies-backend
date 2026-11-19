import { z } from 'zod';

export const verifyImageSchema = z.object({
    image: z.string().min(4).max(8_000_000),
});