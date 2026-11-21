import { Schema, model } from 'mongoose';

export type NotificationType = 'comment' | 'reply';

export interface INotification {
    id: string;
    userId: string; // yaarukku notification
    type: NotificationType;
    message: string;
    actorName?: string;
    postId?: string;
    commentId?: string;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        type: { type: String, enum: ['comment', 'reply'], required: true },
        message: { type: String, required: true },
        actorName: String,
        postId: String,
        commentId: String,
        isRead: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);