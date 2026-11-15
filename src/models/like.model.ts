import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * One document per (user, target) pair. target can be a Post or Comment ObjectId.
 * The unique index is the real guard — two simultaneous toggles resolve correctly.
 */
const likeSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        target: { type: Schema.Types.ObjectId, required: true }, // Post or Comment id
        targetModel: { type: String, enum: ['Post', 'Comment'], required: true },
    },
    { timestamps: true },
);

likeSchema.index({ user: 1, target: 1 }, { unique: true }); // prevent duplicate likes

export type Like = InferSchemaType<typeof likeSchema>;
export const LikeModel = model('Like', likeSchema);
