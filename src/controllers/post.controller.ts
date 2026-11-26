import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import * as postService from '../services/post.service';
import * as walletService from '../services/wallet.service';
import { HttpError } from '../utils/httpError';
import { ok } from '../utils/response';
import { postListQuerySchema } from '../validators/post.validator';

export async function list(req: Request, res: Response) {
    const q = postListQuerySchema.parse(req.query);
    return ok(res, await postService.list(req.user!, { page: q.page, limit: q.limit, type: q.type ? postService.normalizeType(q.type) : undefined }));
}

export async function getOne(req: Request, res: Response) {
    return ok(res, await postService.get(req.user!, String(req.params.id))); // Android: data = Post direct
}

export async function create(req: Request, res: Response) {
    return ok(res, await postService.create(req.user!, req.body), 'Post created', 201);
}

export async function remove(req: Request, res: Response) {
    await postService.remove(req.user!, String(req.params.id));
    return ok(res, undefined, 'Post deleted');
}

export async function toggleLike(req: Request, res: Response) {
    return ok(res, await postService.toggleLike(req.user!, String(req.params.id)));
}

/** Wallet la irundhu unlock. */
export async function unlock(req: Request, res: Response) {
    const r = await postService.unlock(req.user!, String(req.params.id));
    const balancePaise = await walletService.getBalancePaise(req.user!.id);
    return ok(res, { ...r, balance: walletService.toRupees(balancePaise) }, r.alreadyUnlocked ? 'Already unlocked' : 'Story unlocked');
}

/** Direct payment (UPI, card...) la story unlock: order create. */
export async function unlockOrder(req: Request, res: Response) {
    return ok(res, await paymentService.createStoryOrder(req.user!, String(req.params.id)), 'Order created', 201);
}

export async function unlockVerify(req: Request, res: Response) {
    const r = await paymentService.verifyStoryUnlock(req.user!, req.body, String(req.params.id));
    return ok(res, r, r.processing ? 'Payment received, unlocking. Please retry in a moment.' : r.alreadyProcessed ? 'Already unlocked' : 'Story unlocked');
}   