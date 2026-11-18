import type { Response } from 'express';

/** Every API response uses this envelope: { success, message?, data? } (matches the Android app). */
export interface Envelope<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export function ok<T>(res: Response, data?: T, message?: string, status = 200): Response {
    const body: Envelope<T> = { success: true };
    if (message !== undefined) body.message = message;
    if (data !== undefined) body.data = data;
    return res.status(status).json(body);
}

export function fail(res: Response, status: number, message: string, data?: unknown): Response {
    const body: Envelope = { success: false, message };
    if (data !== undefined) body.data = data;
    return res.status(status).json(body);
}