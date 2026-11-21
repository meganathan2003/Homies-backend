import { Like } from '../models/like.model';
import { IPayment } from '../models/payment.model';
import { IPost, Post, PostType } from '../models/post.model';
import { StoryPurchase } from '../models/storyPurchase.model';
import { User, UserDoc } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';
import { isOwnedMediaUrl } from '../utils/media';
import * as likeService from './like.service';
import * as wallet from './wallet.service';

const PREVIEW_CHARS = 150;

/** Android pazhaya "TRUE_EVENTS" anuppinaalum "STORIES" nu eduthukkum. */
export function normalizeType(t: string): PostType {
    return (t === 'TRUE_EVENTS' ? 'STORIES' : t) as PostType;
}

export const previewOf = (content: string): string =>
    content.length <= PREVIEW_CHARS ? content : content.slice(0, PREVIEW_CHARS).trimEnd() + '...';

type PostLike = Pick<IPost, 'id' | 'userId' | 'type' | 'title' | 'content' | 'media' | 'hashtags' | 'isAnonymous' | 'isPaid' | 'pricePaise' | 'pats' | 'totalComments' | 'createdAt'>;
type Viewer = { id: string; role: string };
type Ctx = { liked: Set<string>; unlocked: Set<string>; names: Map<string, string> };

export function isLocked(viewer: Viewer, p: Pick<IPost, 'id' | 'type' | 'isPaid'>, unlocked: Set<string>): boolean {
    return p.type === 'STORIES' && p.isPaid && viewer.role !== 'admin' && !unlocked.has(p.id);
}

export function toPostDto(viewer: Viewer, p: PostLike, ctx: Ctx) {
    const locked = isLocked(viewer, p, ctx.unlocked);
    const anon = p.isAnonymous;
    return {
        id: p.id,
        userId: anon ? 'anonymous' : p.userId,
        authorName: anon ? 'Anonymous' : ctx.names.get(p.userId) ?? 'Homie',
        isMine: p.userId === viewer.id,
        ...(anon && viewer.role === 'admin' ? { authorUserId: p.userId } : {}), // moderation ku mattum
        type: p.type,
        title: p.title,
        content: locked ? previewOf(p.content) : p.content,
        media: locked ? [] : p.media,
        hashtags: p.hashtags,
        pats: p.pats,
        isPatted: ctx.liked.has(p.id),
        totalComments: p.totalComments,
        isPaid: p.isPaid,
        price: wallet.toRupees(p.pricePaise),
        locked,
        createdAt: p.createdAt,
    };
}

async function buildCtx(viewer: Viewer, posts: PostLike[]): Promise<Ctx> {
    const ids = posts.map((p) => p.id);
    const authorIds = [...new Set(posts.map((p) => p.userId))];
    const [likes, purchases, users] = await Promise.all([
        Like.find({ userId: viewer.id, targetType: 'post', targetId: { $in: ids } }),
        StoryPurchase.find({ userId: viewer.id, postId: { $in: ids } }),
        User.find({ id: { $in: authorIds } }).select('id firstName'),
    ]);
    return {
        liked: new Set(likes.map((l) => l.targetId)),
        unlocked: new Set(purchases.map((p) => p.postId)),
        names: new Map(users.map((u) => [u.id, u.firstName])),
    };
}

export async function list(user: UserDoc, q: { page: number; limit: number; type?: PostType }) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (q.type) filter.type = q.type;
    const [posts, total] = await Promise.all([
        Post.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
        Post.countDocuments(filter),
    ]);
    const ctx = await buildCtx(user, posts);
    return {
        posts: posts.map((p) => toPostDto(user, p, ctx)),
        page: q.page,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
    };
}

export async function get(user: UserDoc, id: string) {
    const p = await Post.findOne({ id, isDeleted: false });
    if (!p) throw new HttpError(404, 'Post not found');
    return toPostDto(user, p, await buildCtx(user, [p]));
}

/** Comment / like panna munnaadi: paid story unlock aagirukkanum. */
export async function assertCanInteract(user: UserDoc, postId: string) {
    const p = await Post.findOne({ id: postId, isDeleted: false });
    if (!p) throw new HttpError(404, 'Post not found');
    if (p.type === 'STORIES' && p.isPaid && user.role !== 'admin') {
        const bought = await StoryPurchase.exists({ userId: user.id, postId });
        if (!bought) throw new HttpError(403, 'Unlock this story first');
    }
    return p;
}

export async function create(
    user: UserDoc,
    input: {
        type: string; title?: string; content: string; media?: { type: 'image' | 'video'; uri: string }[];
        hashtags?: string[]; isAnonymous?: boolean; isPaid?: boolean; price?: number;
    },
) {
    const type = normalizeType(input.type);
    if (type === 'STORIES' && user.role !== 'admin') throw new HttpError(403, 'Only admin can post stories');
    if (input.isAnonymous && type !== 'HELP') throw new HttpError(400, 'Anonymous posting is only for Seek Help posts');
    if (input.isPaid && type !== 'STORIES') throw new HttpError(400, 'Only stories can be paid');
    if (input.isPaid && !input.price) throw new HttpError(400, 'Price is required for a paid story');

    const media = input.media ?? [];
    if (media.some((m) => !isOwnedMediaUrl(m.uri))) throw new HttpError(400, 'Media must be uploaded through the upload API first');

    const seen = new Set<string>();
    const hashtags = (input.hashtags ?? [])
        .map((h) => h.replace(/^#/, ''))
        .filter((h) => (seen.has(h.toLowerCase()) ? false : (seen.add(h.toLowerCase()), true)));

    const p = await Post.create({
        id: newId('post'), userId: user.id, type, title: input.title, content: input.content, media, hashtags,
        isAnonymous: !!input.isAnonymous, isPaid: !!input.isPaid, pricePaise: input.isPaid ? input.price! * 100 : 0,
    });
    return toPostDto(user, p, await buildCtx(user, [p]));
}

/** Owner or admin. Soft delete (data pogaadhu, moderation ku). */
export async function remove(user: UserDoc, id: string) {
    const p = await Post.findOne({ id, isDeleted: false });
    if (!p) throw new HttpError(404, 'Post not found');
    if (p.userId !== user.id && user.role !== 'admin') throw new HttpError(403, 'Forbidden');
    p.isDeleted = true;
    await p.save();
}

export async function toggleLike(user: UserDoc, id: string) {
    await assertCanInteract(user, id);
    return likeService.toggle(user.id, 'post', id);
}

/** Paid story ah wallet la irundhu panam kuduthu unlock. Panam Homies ku (StoryPurchase = revenue record). */
export async function unlock(user: UserDoc, id: string) {
    const p = await Post.findOne({ id, isDeleted: false });
    if (!p || p.type !== 'STORIES') throw new HttpError(404, 'Story not found');
    if (!p.isPaid || user.role === 'admin') return { unlocked: true, alreadyUnlocked: true };
    if (await StoryPurchase.exists({ userId: user.id, postId: id })) return { unlocked: true, alreadyUnlocked: true };

    await wallet.debit(user.id, p.pricePaise, {
        reason: 'story_purchase', refType: 'post', refId: id, description: `Story: ${p.title ?? 'Premium story'}`,
    });
    try {
        await StoryPurchase.create({ id: newId('stp'), userId: user.id, postId: id, pricePaise: p.pricePaise });
    } catch (err) {
        // Rendu request ore neram vandhaa: rendavathu ku panam thirumba
        await wallet.credit(user.id, p.pricePaise, {
            reason: 'refund', refType: 'story_unlock_failed', refId: newId('rf'), description: 'Story already unlocked',
        });
        if ((err as { code?: number }).code === 11000) return { unlocked: true, alreadyUnlocked: true };
        throw err;
    }
    return { unlocked: true, alreadyUnlocked: false };
}

/** Direct Razorpay unlock ku munnadi: paid story ah, innum unlock aagala nu check. */
export async function assertUnlockable(user: UserDoc, id: string) {
    const p = await Post.findOne({ id, isDeleted: false });
    if (!p || p.type !== 'STORIES') throw new HttpError(404, 'Story not found');
    if (!p.isPaid || user.role === 'admin') throw new HttpError(400, 'This story is free');
    if (await StoryPurchase.exists({ userId: user.id, postId: id })) {
        throw new HttpError(409, 'Story already unlocked', 'ALREADY_UNLOCKED');
    }
    return p;
}

/** Razorpay payment success aana piragu story unlock. Rendu thadavai call aanaalum oru purchase mattum. */
export async function unlockFromPayment(payment: Pick<IPayment, 'id' | 'userId' | 'refId' | 'amount'>) {
    if (await StoryPurchase.exists({ paymentId: payment.id })) return;
    const postId = payment.refId!;
    const refund = () =>
        wallet.credit(payment.userId, payment.amount, {
            reason: 'refund', refType: 'payment_refund', refId: payment.id, description: 'Story was already unlocked',
        });

    if (await StoryPurchase.exists({ userId: payment.userId, postId })) {
        await refund();
        return;
    }
    try {
        await StoryPurchase.create({
            id: newId('stp'), userId: payment.userId, postId, pricePaise: payment.amount, paidBy: 'razorpay', paymentId: payment.id,
        });
    } catch (err) {
        if (await StoryPurchase.exists({ paymentId: payment.id })) return;
        if ((err as { code?: number }).code === 11000) { await refund(); return; }
        throw err;
    }
}