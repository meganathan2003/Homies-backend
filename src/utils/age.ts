/** Full years completed on `now` (UTC). Born 2000-05-20 -> turns 26 on 2026-05-20, not on 2026-01-01. */
export function calculateAge(dob: Date, now: Date = new Date()): number {
    let age = now.getUTCFullYear() - dob.getUTCFullYear();
    const beforeBirthday =
        now.getUTCMonth() < dob.getUTCMonth() ||
        (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
    if (beforeBirthday) age -= 1;
    return age;
}

/** The labels the Android app already uses. */
export function ageBracketFor(age: number): string | null {
    if (age < 18) return null;
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    if (age <= 64) return '55-64';
    return '65+';
}