import type { UserDoc } from '../models/user.model';

// Declaration merging: tells TypeScript that `req.user` exists after requireAuth has run.
declare global {
    namespace Express {
        interface Request {
            user?: UserDoc;
        }
    }
}

export { };