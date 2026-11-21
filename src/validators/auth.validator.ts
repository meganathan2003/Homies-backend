import { z } from 'zod';
import { PURPOSE_KEYS } from '../constants/loginPurpose';
import { HELPS, INTERESTS } from '../constants/catalog';

export const loginSchema = z.object({
    idToken: z.string().min(8),
});

export const registerSchema = z.object({
    idToken: z.string().min(8),
    firstName: z.string().trim().min(1).max(60),
    dob: z.string().optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().min(1),
    mobileNumber: z.string().trim().min(6).max(15),
    profession: z.string().trim().min(1),
    workTiming: z.string().optional(),
    typeOfWork: z.string().trim().min(1),
});

export const purposeSchema = z.object({
    purpose: z.enum(PURPOSE_KEYS),
});

export const updateProfileSchema = z.object({
    firstName: z.string().trim().min(1).max(60).optional(),
    dob: z.string().optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1).optional(),
    mobileNumber: z.string().trim().min(6).max(15).optional(),
    profession: z.string().trim().min(1).optional(),
    workTiming: z.string().optional(),
    typeOfWork: z.string().trim().min(1).optional(),
    helps: z.array(z.enum(HELPS)).max(10).optional(),
    interests: z.array(z.enum(INTERESTS)).max(10).optional(),
});

export const updateVerificationSchema = z.object({
    id: z.string().min(1),
    isImageVerified: z.boolean().optional(),
    isVoiceVerified: z.boolean().optional(),
});