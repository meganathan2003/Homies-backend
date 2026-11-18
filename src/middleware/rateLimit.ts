import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

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


/** Face check: 10 tries per 15 minutes per logged-in user (stops guessing, protects the paid AWS call later). */
export const faceLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
});