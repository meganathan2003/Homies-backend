import { Schema, model } from 'mongoose';

export interface IConversation {
    id: string;
    consultationId: string;
    userId: string;
    expertId: string;
    status: 'active' | 'closed';
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        id: { type: String, required: true, unique: true },
        consultationId: { type: String, required: true },
        userId: { type: String, required: true, index: true },
        expertId: { type: String, required: true, index: true },
        status: { type: String, enum: ['active', 'closed'], default: 'active' },
        lastMessage: String,
        lastMessageAt: Date,
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

export const Conversation = model<IConversation>('Conversation', conversationSchema);