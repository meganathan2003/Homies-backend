/**
 * MongoDB error 11000 = a unique index was violated.
 * Returns which field(s) clashed (e.g. ['email']), or null if this is some other error.
 */
export function duplicateKeyFields(err: unknown): string[] | null {
    if (typeof err !== 'object' || err === null) return null;
    const e = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (e.code !== 11000) return null;
    return Object.keys(e.keyPattern ?? {});
}