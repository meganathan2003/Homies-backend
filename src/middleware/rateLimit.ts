import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false,
});
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, try again later' },
});


export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Too many payment attempts, try again later' },
});