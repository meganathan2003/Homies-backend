import { Schema, model } from 'mongoose';

export interface ILike {
    userId: string;
    targetType: 'post' | 'comment';
    targetId: string;
    createdAt: Date;
}

const likeSchema = new Schema<ILike>(
    {
        userId: { type: String, required: true },
        targetType: { type: String, enum: ['post', 'comment'], required: true },
        targetId: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
// Oru user oru post/comment ku oru like mattum
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Like = model<ILike>('Like', likeSchema);