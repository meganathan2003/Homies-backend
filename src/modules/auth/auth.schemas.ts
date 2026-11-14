import { z } from 'zod';
import { calculateAge } from '../../utils/age';
import { parseWorkTiming } from '../../utils/workTiming';

const text = (max: number) => z.string().trim().min(1).max(max);

const dob = z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'dob must be a valid date')
    .transform((s) => new Date(s))
    .refine((d) => calculateAge(d) >= 18, 'You must be at least 18 years old')
    .refine((d) => calculateAge(d) <= 100, 'dob is not realistic');

const workTiming = z
    .string()
    .refine((s) => parseWorkTiming(s) !== null, 'workTiming must look like "9AM to 5PM"')
    .transform((s) => parseWorkTiming(s)!.label);

// Only the fields listed here are read. Anything else the client sends (firstName, role,
// homieId, isImageVerified ...) is silently dropped by zod, so it can never reach the database.
export const registerSchema = z.object({
    idToken: z.string().min(1).optional(),
    email: z.email().optional(), // used only by the dev bypass
    platform: z.string().optional(),
    dob,
    country: text(100),
    state: text(100),
    city: text(100),
    mobileNumber: z.string().trim().regex(/^\d{10}$/, 'mobileNumber must be 10 digits'),
    profession: text(100),
    workTiming,
    typeOfWork: z.string().trim().min(10, 'typeOfWork must be at least 10 characters').max(300),
});

export const loginSchema = z.object({
    idToken: z.string().min(1).optional(),
    email: z.email().optional(), // used only by the dev bypass
    platform: z.string().optional(),
});

const names = z
    .array(z.string().trim().min(1).max(100))
    .max(20)
    .transform((list) => [...new Set(list)]); // trim + remove duplicates

// The app sends helps and interests in SEPARATE calls, and may send the other one as null.
// Only fields that are actually present are updated. `id` in the body is ignored on purpose.
export const updateProfileSchema = z
    .object({
        helps: names.nullish(),
        interests: names.nullish(),
    })
    .refine((v) => v.helps != null || v.interests != null, 'Nothing to update: send helps and/or interests');

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;