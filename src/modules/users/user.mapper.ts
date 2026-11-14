import type { UserDoc } from '../../models/user.model';
import { ageBracketFor, calculateAge } from '../../utils/age';

/**
 * What a user may see about THEMSELVES (Android `User` model).
 * Never return a Mongoose document directly: this function is the only door out.
 * Needs the document to be loaded with `+dob +mobileNumber` (they are select:false).
 */
export function toSelfDto(user: UserDoc) {
    const age = user.dob ? calculateAge(user.dob) : null;
    return {
        id: user.id as string,
        // Members have no stored name: the app shows their anonymous alias instead.
        // name: user.role === 'member' ? user.anonymousAlias : (user.name ?? user.anonymousAlias),
        homiesId: user.homiesId,
        email: user.email,
        dob: user.dob ? user.dob.toISOString() : null,
        ageBracket: age === null ? null : ageBracketFor(age),
        country: user.country ?? null,
        state: user.state ?? null,
        city: user.city ?? null,
        mobileNumber: user.mobileNumber ?? null,
        profession: user.profession ?? null,
        workTiming: user.workTiming ?? null,
        typeOfWork: user.typeOfWork ?? null,
        helps: [...user.helps],
        interests: [...user.interests],
        isImageVerified: user.isImageVerified,
        isVoiceVerified: user.isVoiceVerified,
        isProfileVerified: user.isProfileVerified,
    };
}