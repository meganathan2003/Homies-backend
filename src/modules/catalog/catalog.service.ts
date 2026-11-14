import { CatalogItemModel, type CatalogType } from '../../models/catalog-item.model';
import { badRequest } from '../../utils/errors';

export async function listCatalog(type: CatalogType) {
    // lean() = plain JS objects instead of full Mongoose documents: faster, and read-only is all we need here.
    return CatalogItemModel.find({ type, isActive: true }).sort({ order: 1, name: 1 }).lean();
}

/**
 * Checks that every name exists in the catalog and returns the official spelling.
 * "anxiety" -> "Anxiety". Unknown names are rejected so users can't store random text.
 */
export async function resolveCatalogNames(type: CatalogType, names: string[]): Promise<string[]> {
    const items = await listCatalog(type);
    const official = new Map(items.map((i) => [i.name.toLowerCase(), i.name]));

    const resolved = names.map((n) => {
        const match = official.get(n.toLowerCase());
        if (!match) throw badRequest(`Unknown ${type}: "${n}"`);
        return match;
    });
    return [...new Set(resolved)];
}