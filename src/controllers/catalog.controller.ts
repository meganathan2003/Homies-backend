import { Request, Response } from 'express';
import { HASHTAGS, HELPS, INTERESTS } from '../constants/catalog';
import { ok } from '../utils/response';

export const helps = (_req: Request, res: Response) =>
    ok(res, { helps: HELPS.map((help, i) => ({ id: `h${i + 1}`, help })) });

export const interests = (_req: Request, res: Response) =>
    ok(res, { interests: INTERESTS.map((interest, i) => ({ id: `i${i + 1}`, interest })) });

export const hashtags = (_req: Request, res: Response) => ok(res, { hashtags: HASHTAGS });