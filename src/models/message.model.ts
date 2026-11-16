import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema(
    {
        conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, trim: true },
        // Extra fields the Android client sends via socket — stored as-is for compatibility.
        senderDetails: { type: Schema.Types.Mixed, default: null },
        receiverDetail: { type: Schema.Types.Mixed, default: null },
    },
    { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 }); // history query (newest first)

export type Message = InferSchemaType<typeof messageSchema>;
export type MessageDoc = HydratedDocument<Message>;
export const MessageModel = model('Message', messageSchema);
