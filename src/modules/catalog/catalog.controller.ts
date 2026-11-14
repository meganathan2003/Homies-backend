import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { listCatalog } from './catalog.service';

// Response shapes are fixed by the Android app: { helps:[{id,help}] }, { interests:[{id,interest}] }, { hashtags:[string] }
export async function getHelps(_req: Request, res: Response) {
    const items = await listCatalog('help');
    ok(res, { helps: items.map((i) => ({ id: String(i._id), help: i.name })) });
}

export async function getInterests(_req: Request, res: Response) {
    const items = await listCatalog('interest');
    ok(res, { interests: items.map((i) => ({ id: String(i._id), interest: i.name })) });
}

export async function getHashtags(_req: Request, res: Response) {
    const items = await listCatalog('hashtag');
    ok(res, { hashtags: items.map((i) => i.name) });
}