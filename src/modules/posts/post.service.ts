import { isObjectIdOrHexString } from 'mongoose';
import { PostModel, type PostDoc } from '../../models/post.model';
import { LikeModel } from '../../models/like.model';
import { UserModel } from '../../models/user.model';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { toAuthorDto } from '../users/author.mapper';
import type { CreatePostInput, FeedQuery } from './post.schemas';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Resolve the alias of a post author from the populated or plain author field. */
async function resolveAlias(authorId: string): Promise<string> {
    const user = await UserModel.findById(authorId).select('homiesId role').lean();
    return user?.homiesId ?? 'Unknown';
}

/** Shape a single post document for the feed or detail response. */
async function toPostDto(post: PostDoc, requesterId: string) {
    const authorId = String(post.author);
    const alias = await resolveAlias(authorId);
    return {
        id: post.id as string,
        type: post.type,
        content: post.content,
        mediaUrls: post.mediaUrls,
        hashtags: post.hashtags,
        pats: post.pats,
        totalComments: post.totalComments,
        author: toAuthorDto(authorId, alias, requesterId),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
}

// ─── service functions ───────────────────────────────────────────────────────

export async function getFeed(query: FeedQuery, requesterId: string) {
    const filter: Record<string, unknown> = { isRemoved: false };
    if (query.type) filter.type = query.type;

    const total = await PostModel.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit) || 1;
    const posts = await PostModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<PostDoc[]>();

    // Batch-fetch liked status for the requester in one query
    const postIds = posts.map((p) => p._id);
    const liked = await LikeModel.find({ user: requesterId, target: { $in: postIds }, targetModel: 'Post' }).lean();
    const likedSet = new Set(liked.map((l) => String(l.target)));

    const dtos = await Promise.all(
        posts.map(async (post) => {
            const dto = await toPostDto(post as PostDoc, requesterId);
            return { ...dto, isPatted: likedSet.has(String(post._id)) };
        }),
    );

    return { posts: dtos, page: query.page, totalPages };
}

export async function getPostById(postId: string, requesterId: string) {
    if (!isObjectIdOrHexString(postId)) throw badRequest('Invalid post id');
    const post = await PostModel.findOne({ _id: postId, isRemoved: false });
    if (!post) throw notFound('Post not found');

    const liked = await LikeModel.exists({ user: requesterId, target: post._id, targetModel: 'Post' });
    const dto = await toPostDto(post, requesterId);
    return { ...dto, isPatted: !!liked };
}

export async function createPost(input: CreatePostInput, requesterId: string, requesterRole: string) {
    // Only admins can publish TRUE_EVENTS
    if (input.type === 'TRUE_EVENTS' && requesterRole !== 'admin') {
        throw forbidden('Only admins can create TRUE_EVENTS posts.');
    }
    const post = await PostModel.create({
        author: requesterId,
        type: input.type,
        content: input.content,
        mediaUrls: input.mediaUrls,
        hashtags: input.hashtags,
    });
    return toPostDto(post, requesterId);
}

export async function togglePostLike(postId: string, requesterId: string) {
    if (!isObjectIdOrHexString(postId)) throw badRequest('Invalid post id');
    const post = await PostModel.findOne({ _id: postId, isRemoved: false });
    if (!post) throw notFound('Post not found');

    const existing = await LikeModel.findOne({ user: requesterId, target: post._id, targetModel: 'Post' });

    if (existing) {
        // un-pat
        await existing.deleteOne();
        await PostModel.updateOne({ _id: post._id }, { $inc: { pats: -1 } });
        return { isPatted: false, pats: Math.max(0, post.pats - 1) };
    } else {
        // pat
        await LikeModel.create({ user: requesterId, target: post._id, targetModel: 'Post' });
        await PostModel.updateOne({ _id: post._id }, { $inc: { pats: 1 } });
        return { isPatted: true, pats: post.pats + 1 };
    }
}
