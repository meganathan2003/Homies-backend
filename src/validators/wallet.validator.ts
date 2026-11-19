import { z } from 'zod';

export const topupOrderSchema = z.object({
    amount: z.number().int().min(10).max(50000), // rupees
});

export const verifyTopupSchema = z.object({
    razorpay_order_id: z.string().min(5),
    razorpay_payment_id: z.string().min(5),
    razorpay_signature: z.string().min(10),
});

export const topupFailureSchema = z.object({
    razorpay_order_id: z.string().min(5),
    reason: z.string().max(200).optional(),
});

export const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});