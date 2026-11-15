import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const mediaSchema = new Schema(
    {
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        url: { type: String, required: true },
        filename: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true }, // bytes
    },
    { timestamps: true },
);

mediaSchema.index({ uploadedBy: 1 });

export type Media = InferSchemaType<typeof mediaSchema>;
export type MediaDoc = HydratedDocument<Media>;
export const MediaModel = model('Media', mediaSchema);
