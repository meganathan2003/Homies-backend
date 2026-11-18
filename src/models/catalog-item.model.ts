import { Schema, model, type InferSchemaType } from 'mongoose';

export const CATALOG_TYPES = ['help', 'interest', 'hashtag'] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

/** One collection for all three lists (helps, interests, hashtags), told apart by `type`. */
const catalogItemSchema = new Schema(
    {
        type: { type: String, enum: CATALOG_TYPES, required: true },
        name: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }, // hide an item without deleting it
    },
    { timestamps: true },
);

// "Anxiety" and "anxiety" are the same item (collation strength 2 = ignore case).
catalogItemSchema.index({ type: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
// The query every GET uses: active items of one type, in display order.
catalogItemSchema.index({ type: 1, isActive: 1, order: 1 });

export type CatalogItem = InferSchemaType<typeof catalogItemSchema>;
export const CatalogItemModel = model('CatalogItem', catalogItemSchema);