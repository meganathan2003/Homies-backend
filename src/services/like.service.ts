import { Comment } from '../models/comment.model';
import { Like } from '../models/like.model';
import { Post } from '../models/post.model';

/** Like pottaa remove, illa na add. Count atomic ah maarum. */
export async function toggle(userId: string, targetType: 'post' | 'comment', targetId: string) {
    const removed = await Like.findOneAndDelete({ userId, targetType, targetId });
    let liked: boolean;
    let delta: number;
    if (removed) {
        liked = false;
        delta = -1;
    } else {
        try {
            await Like.create({ userId, targetType, targetId });
            liked = true;
            delta = 1;
        } catch (err) {
            if ((err as { code?: number }).code === 11000) { liked = true; delta = 0; } // rendu request ore neram
            else throw err;
        }
    }
    const Model: any = targetType === 'post' ? Post : Comment;
    if (delta !== 0) await Model.updateOne({ id: targetId }, { $inc: { pats: delta } });
    const doc = await Model.findOne({ id: targetId }).select('pats');
    return { liked, pats: Math.max(0, doc?.pats ?? 0) };
}