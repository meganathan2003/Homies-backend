import { Schema, model } from 'mongoose';

export interface IComment {
    id: string;
    postId: string;
    userId: string;
    content: string;
    parentCommentId: string | null;
    isAnonymous: boolean; // anonymous post oda author thaane comment panna, name maraikkum
    pats: number;
    repliesCount: number;
    isDeleted: boolean;
    createdAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        id: { type: String, required: true, unique: true },
        postId: { type: String, required: true },
        userId: { type: String, required: true, index: true },
        content: { type: String, required: true, maxlength: 2000 },
        parentCommentId: { type: String, default: null },
        isAnonymous: { type: Boolean, default: false },
        pats: { type: Number, default: 0, min: 0 },
        repliesCount: { type: Number, default: 0, min: 0 },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
commentSchema.index({ postId: 1, parentCommentId: 1, isDeleted: 1, createdAt: -1 });

export const Comment = model<IComment>('Comment', commentSchema);