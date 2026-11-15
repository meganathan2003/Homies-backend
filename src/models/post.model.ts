import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const POST_TYPES = ['HELP', 'SOCIAL', 'TRUE_EVENTS'] as const;
export type PostType = (typeof POST_TYPES)[number];

const postSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: POST_TYPES, required: true },
        content: { type: String, required: true, trim: true, maxlength: 2000 },
        mediaUrls: { type: [String], default: [] }, // up to 5 URLs
        hashtags: { type: [String], default: [] },  // leading # already stripped

        // Counters kept on the post itself to avoid expensive count queries on every feed load.
        pats: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },

        isRemoved: { type: Boolean, default: false }, // soft-delete by admin (M7)
    },
    { timestamps: true },
);

postSchema.index({ type: 1, createdAt: -1 }); // feed query
postSchema.index({ author: 1 });
postSchema.index({ hashtags: 1 });

export type Post = InferSchemaType<typeof postSchema>;
export type PostDoc = HydratedDocument<Post>;
export const PostModel = model('Post', postSchema);
