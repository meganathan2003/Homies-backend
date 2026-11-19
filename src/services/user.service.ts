import { UserDoc } from '../models/user.model';

export function toPublicUser(u: UserDoc) {
    return {
        id: u.id,
        homieId: u.homieId,
        email: u.email,
        firstName: u.firstName,
        dob: u.dob,
        city: u.city,
        state: u.state,
        country: u.country,
        mobileNumber: u.mobileNumber,
        profession: u.profession,
        workTiming: u.workTiming,
        typeOfWork: u.typeOfWork,
        profileImage: u.profileImage,
        role: u.role,
        isImageVerified: u.isImageVerified,
    };
}

export type ProfileUpdate = Partial<
    Pick<UserDoc, 'firstName' | 'dob' | 'city' | 'state' | 'country' | 'mobileNumber' | 'profession' | 'workTiming' | 'typeOfWork'>
>;

export async function updateProfile(user: UserDoc, patch: ProfileUpdate): Promise<UserDoc> {
    user.set(patch);
    await user.save();
    return user;
}