export class AppError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const badRequest = (m = 'Bad request', d?: unknown) => new AppError(400, m, d);
export const unauthorized = (m = 'Unauthorized') => new AppError(401, m);
export const forbidden = (m = 'Forbidden') => new AppError(403, m);
export const notFound = (m = 'Not found') => new AppError(404, m);
export const conflict = (m = 'Conflict') => new AppError(409, m);
export const unavailable = (m = 'Service unavailable') => new AppError(503, m);