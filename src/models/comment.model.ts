import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const commentSchema = new Schema(
    {
        post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true, maxlength: 1000 },

        // null = top-level comment; ObjectId = reply to that comment (one level only)
        parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },

        pats: { type: Number, default: 0 },
        totalReplies: { type: Number, default: 0 }, // kept on parent for fast reply counts

        isRemoved: { type: Boolean, default: false }, // soft-delete by admin (M7)
    },
    { timestamps: true },
);

commentSchema.index({ post: 1, parentComment: 1, createdAt: -1 }); // top-level + replies
commentSchema.index({ author: 1 });

export type Comment = InferSchemaType<typeof commentSchema>;
export type CommentDoc = HydratedDocument<Comment>;
export const CommentModel = model('Comment', commentSchema);
