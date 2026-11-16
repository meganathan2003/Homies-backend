import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const CONVERSATION_STATUSES = ['active', 'completed'] as const;

const conversationSchema = new Schema(
    {
        member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        expert: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: CONVERSATION_STATUSES, default: 'active' },
        lastMessage: { type: String, default: '' },
        lastActivityAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

// A member can have only one ACTIVE conversation with an expert at a time.
conversationSchema.index({ member: 1, expert: 1, status: 1 });
conversationSchema.index({ lastActivityAt: 1 }); // auto-complete job

export type Conversation = InferSchemaType<typeof conversationSchema>;
export type ConversationDoc = HydratedDocument<Conversation>;
export const ConversationModel = model('Conversation', conversationSchema);
