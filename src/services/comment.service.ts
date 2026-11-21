import { Comment, IComment } from '../models/comment.model';
import { Like } from '../models/like.model';
import { Post } from '../models/post.model';
import { User, UserDoc } from '../models/user.model';
import { HttpError } from '../utils/httpError';
import { newId } from '../utils/id';
import * as likeService from './like.service';
import * as notifications from './notification.service';
import { assertCanInteract } from './post.service';

type CommentLike = Pick<IComment, 'id' | 'postId' | 'userId' | 'content' | 'parentCommentId' | 'isAnonymous' | 'pats' | 'repliesCount' | 'createdAt'>;

function toCommentDto(viewerId: string, c: CommentLike, names: Map<string, string>, liked: Set<string>) {
    return {
        id: c.id,
        postId: c.postId,
        userId: c.isAnonymous ? 'anonymous' : c.userId,
        name: c.isAnonymous ? 'Anonymous' : names.get(c.userId) ?? 'Homie',
        isMine: c.userId === viewerId,
        content: c.content,
        parentCommentId: c.parentCommentId,
        pats: c.pats,
        isPatted: liked.has(c.id),
        repliesCount: c.repliesCount,
        postedTime: c.createdAt,
    };
}

async function dtos(viewerId: string, items: CommentLike[]) {
    const [users, likes] = await Promise.all([
        User.find({ id: { $in: [...new Set(items.map((c) => c.userId))] } }).select('id firstName'),
        Like.find({ userId: viewerId, targetType: 'comment', targetId: { $in: items.map((c) => c.id) } }),
    ]);
    const names = new Map(users.map((u) => [u.id, u.firstName]));
    const liked = new Set(likes.map((l) => l.targetId));
    return items.map((c) => toCommentDto(viewerId, c, names, liked));
}

/** postId kudutha top-level comments, commentId kudutha andha comment oda replies. */
export async function list(user: UserDoc, q: { postId?: string; commentId?: string; page: number; limit: number }) {
    let postId = q.postId;
    const filter: Record<string, unknown> = { isDeleted: false };
    if (q.commentId) {
        const parent = await Comment.findOne({ id: q.commentId, isDeleted: false });
        if (!parent) throw new HttpError(404, 'Comment not found');
        postId = parent.postId;
        filter.parentCommentId = q.commentId;
    } else {
        filter.parentCommentId = null;
    }
    await assertCanInteract(user, postId!);
    filter.postId = postId;

    const sort = q.commentId ? 1 : -1; // replies pazhaya mudhal, comments pudhusu mudhal
    const [items, total] = await Promise.all([
        Comment.find(filter).sort({ createdAt: sort }).skip((q.page - 1) * q.limit).limit(q.limit),
        Comment.countDocuments(filter),
    ]);
    return {
        comments: await dtos(user.id, items),
        page: q.page,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
    };
}

export async function create(user: UserDoc, input: { postId: string; content: string; parentCommentId?: string | null }) {
    const post = await assertCanInteract(user, input.postId);

    let parent = null as InstanceType<typeof Comment> | null;
    if (input.parentCommentId) {
        parent = await Comment.findOne({ id: input.parentCommentId, postId: post.id, isDeleted: false });
        if (!parent) throw new HttpError(404, 'Parent comment not found');
        // 1 level nesting mattum: reply ku reply panna, adhe top-level comment kela serum
        if (parent.parentCommentId) {
            parent = await Comment.findOne({ id: parent.parentCommentId, isDeleted: false });
            if (!parent) throw new HttpError(404, 'Parent comment not found');
        }
    }

    const c = await Comment.create({
        id: newId('cmt'), postId: post.id, userId: user.id, content: input.content.trim(),
        parentCommentId: parent ? parent.id : null,
        isAnonymous: post.isAnonymous && post.userId === user.id, // anonymous OP ah irundha name maraikkum
    });
    await Post.updateOne({ id: post.id }, { $inc: { totalComments: 1 } });
    if (parent) await Comment.updateOne({ id: parent.id }, { $inc: { repliesCount: 1 } });

    // Helper notifications: yaaraavathu respond pannina post/comment author ku
    const actorName = user.firstName;
    if (parent && parent.userId !== user.id) {
        await notifications.notify(parent.userId, { type: 'reply', message: `${actorName} replied to your comment`, actorName, postId: post.id, commentId: c.id });
    }
    if (post.userId !== user.id && !(parent && parent.userId === post.userId)) {
        await notifications.notify(post.userId, { type: 'comment', message: `${actorName} responded to your post`, actorName, postId: post.id, commentId: c.id });
    }

    return (await dtos(user.id, [c]))[0];
}

/** Owner or admin. Replies kooda soft delete aagum, counts adjust aagum. */
export async function remove(user: UserDoc, id: string) {
    const c = await Comment.findOne({ id, isDeleted: false });
    if (!c) throw new HttpError(404, 'Comment not found');
    if (c.userId !== user.id && user.role !== 'admin') throw new HttpError(403, 'Forbidden');

    c.isDeleted = true;
    await c.save();
    const replies = await Comment.updateMany({ parentCommentId: c.id, isDeleted: false }, { $set: { isDeleted: true } });
    await Post.updateOne({ id: c.postId, totalComments: { $gte: 1 } }, { $inc: { totalComments: -(1 + replies.modifiedCount) } });
    if (c.parentCommentId) await Comment.updateOne({ id: c.parentCommentId, repliesCount: { $gte: 1 } }, { $inc: { repliesCount: -1 } });
}

export async function toggleLike(user: UserDoc, id: string) {
    const c = await Comment.findOne({ id, isDeleted: false });
    if (!c) throw new HttpError(404, 'Comment not found');
    await assertCanInteract(user, c.postId);
    return likeService.toggle(user.id, 'comment', id);
}