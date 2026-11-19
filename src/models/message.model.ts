import { Schema, model } from 'mongoose';

export interface IMessage {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        id: { type: String, required: true, unique: true },
        conversationId: { type: String, required: true },
        senderId: { type: String, required: true },
        text: { type: String, required: true, maxlength: 2000 },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);