import { rateLimit } from 'express-rate-limit';

const message = { success: false, message: 'Too many requests, please try again later' };

/** Applied to the whole /api router. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message,
});

/** Strict limiter for login/register (used from M1). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message,
});