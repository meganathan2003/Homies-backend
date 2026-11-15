import { isObjectIdOrHexString } from 'mongoose';
import { CommentModel, type CommentDoc } from '../../models/comment.model';
import { PostModel } from '../../models/post.model';
import { LikeModel } from '../../models/like.model';
import { UserModel } from '../../models/user.model';
import { badRequest, notFound } from '../../utils/errors';
import { toAuthorDto } from '../users/author.mapper';
import type { CommentQuery, CreateCommentInput } from './comment.schemas';

// ─── helpers ────────────────────────────────────────────────────────────────

async function resolveAlias(authorId: string): Promise<string> {
    const user = await UserModel.findById(authorId).select('homiesId').lean();
    return user?.homiesId ?? 'Unknown';
}

async function toCommentDto(comment: CommentDoc, requesterId: string) {
    const authorId = String(comment.author);
    const alias = await resolveAlias(authorId);
    return {
        id: comment.id as string,
        postId: String(comment.post),
        parentCommentId: comment.parentComment ? String(comment.parentComment) : null,
        content: comment.content,
        pats: comment.pats,
        totalReplies: comment.totalReplies,
        author: toAuthorDto(authorId, alias, requesterId),
        createdAt: comment.createdAt,
    };
}

// ─── service functions ───────────────────────────────────────────────────────

export async function getComments(query: CommentQuery, requesterId: string) {
    // top-level comments for a post, OR replies for a comment
    const filter: Record<string, unknown> = { isRemoved: false };

    if (query.commentId) {
        if (!isObjectIdOrHexString(query.commentId)) throw badRequest('Invalid commentId');
        filter.parentComment = query.commentId;
    } else if (query.postId) {
        if (!isObjectIdOrHexString(query.postId)) throw badRequest('Invalid postId');
        filter.post = query.postId;
        filter.parentComment = null; // top-level only
    } else {
        throw badRequest('Provide postId (top-level) or commentId (replies)');
    }

    const total = await CommentModel.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit) || 1;
    const comments = await CommentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<CommentDoc[]>();

    // Batch liked status
    const commentIds = comments.map((c) => c._id);
    const liked = await LikeModel.find({ user: requesterId, target: { $in: commentIds }, targetModel: 'Comment' }).lean();
    const likedSet = new Set(liked.map((l) => String(l.target)));

    const dtos = await Promise.all(
        comments.map(async (c) => {
            const dto = await toCommentDto(c as CommentDoc, requesterId);
            return { ...dto, isPatted: likedSet.has(String(c._id)) };
        }),
    );

    return { comments: dtos, page: query.page, totalPages };
}

export async function createComment(input: CreateCommentInput, requesterId: string) {
    if (!isObjectIdOrHexString(input.postId)) throw badRequest('Invalid postId');
    const post = await PostModel.findOne({ _id: input.postId, isRemoved: false });
    if (!post) throw notFound('Post not found');

    let parentComment = null;
    if (input.parentCommentId) {
        if (!isObjectIdOrHexString(input.parentCommentId)) throw badRequest('Invalid parentCommentId');
        const parent = await CommentModel.findOne({ _id: input.parentCommentId, isRemoved: false });
        if (!parent) throw notFound('Parent comment not found');
        // One level of nesting — replies to replies are not allowed
        if (parent.parentComment) throw badRequest('Replies to replies are not supported.');
        parentComment = parent._id;
        // Increment reply count on parent
        await CommentModel.updateOne({ _id: parent._id }, { $inc: { totalReplies: 1 } });
    }

    // Increment comment count on the post
    await PostModel.updateOne({ _id: post._id }, { $inc: { totalComments: 1 } });

    const comment = await CommentModel.create({
        post: post._id,
        author: requesterId,
        content: input.content,
        parentComment,
    });

    return toCommentDto(comment, requesterId);
}

export async function toggleCommentLike(commentId: string, requesterId: string) {
    if (!isObjectIdOrHexString(commentId)) throw badRequest('Invalid comment id');
    const comment = await CommentModel.findOne({ _id: commentId, isRemoved: false });
    if (!comment) throw notFound('Comment not found');

    const existing = await LikeModel.findOne({ user: requesterId, target: comment._id, targetModel: 'Comment' });
    if (existing) {
        await existing.deleteOne();
        await CommentModel.updateOne({ _id: comment._id }, { $inc: { pats: -1 } });
        return { isPatted: false, pats: Math.max(0, comment.pats - 1) };
    } else {
        await LikeModel.create({ user: requesterId, target: comment._id, targetModel: 'Comment' });
        await CommentModel.updateOne({ _id: comment._id }, { $inc: { pats: 1 } });
        return { isPatted: true, pats: comment.pats + 1 };
    }
}
