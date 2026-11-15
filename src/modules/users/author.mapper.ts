import type { UserDoc } from '../../models/user.model';

/**
 * Privacy rule (from the planning doc):
 *   - Member looking at a post/comment author → anonymous alias only (e.g. "Homie-7F3A")
 *   - If the post author IS the requester → return the real id so the app knows it's "mine"
 *   - Experts/admins looking at a member in a feed → still the alias (chat is different, handled in M6)
 *
 * This is the SINGLE door through which author info leaves the server in feed/post/comment contexts.
 * Nothing else should ever expose a member's real identity to other members.
 */

export interface AuthorDto {
    id: string;       // real id when it's the requester's own post, alias otherwise
    alias: string;    // always present (the anonymous display name)
    isOwnPost: boolean;
}

/**
 * Builds the author object for a post or comment.
 * @param authorId   - The ObjectId string of the content author (from the DB document)
 * @param authorAlias - The anonymous alias stored on (or resolved from) the author user doc
 * @param requesterId - The ObjectId string of the authenticated requester (from req.user.id)
 */
export function toAuthorDto(
    authorId: string,
    authorAlias: string,
    requesterId: string,
): AuthorDto {
    const isOwnPost = authorId === requesterId;
    return {
        id: isOwnPost ? authorId : authorAlias, // real id only for own content
        alias: authorAlias,
        isOwnPost,
    };
}

/**
 * What a member sees about another member in a feed (alias only, no PII).
 */
export function toMemberFeedDto(user: UserDoc) {
    return {
        homiesId: user.homiesId,
        // name is never stored for members (enforced by pre-validate hook on the model).
    };
}

/**
 * What anyone can see about an expert in a feed or directory listing.
 * Real name + profession are shown (experts are public figures in the app).
 */
export function toExpertPublicDto(user: UserDoc) {
    return {
        id: user.id as string,
        name: user.name ?? '',
        profession: user.profession ?? '',
        isImageVerified: user.isImageVerified,
        expertProfile: user.expertProfile ?? null,
    };
}
