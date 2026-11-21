import { Schema, model } from 'mongoose';

export type PostType = 'HELP' | 'SOCIAL' | 'STORIES';

export interface IMediaItem {
    type: 'image' | 'video';
    uri: string;
}

export interface IPost {
    id: string;
    userId: string;
    type: PostType;
    title?: string;
    content: string;
    media: IMediaItem[];
    hashtags: string[];
    isAnonymous: boolean;
    isPaid: boolean;
    pricePaise: number;
    pats: number;
    totalComments: number;
    isDeleted: boolean;
    createdAt: Date;
}

const mediaSchema = new Schema<IMediaItem>(
    { type: { type: String, enum: ['image', 'video'], required: true }, uri: { type: String, required: true } },
    { _id: false },
);

const postSchema = new Schema<IPost>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        type: { type: String, enum: ['HELP', 'SOCIAL', 'STORIES'], required: true },
        title: String,
        content: { type: String, required: true, maxlength: 5000 },
        media: { type: [mediaSchema], default: [] },
        hashtags: { type: [String], default: [] },
        isAnonymous: { type: Boolean, default: false },
        isPaid: { type: Boolean, default: false },
        pricePaise: { type: Number, default: 0 },
        pats: { type: Number, default: 0, min: 0 },
        totalComments: { type: Number, default: 0, min: 0 },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
postSchema.index({ type: 1, isDeleted: 1, createdAt: -1 });

export const Post = model<IPost>('Post', postSchema);