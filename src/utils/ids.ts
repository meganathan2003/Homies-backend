import { randomInt } from "node:crypto";

// No look-alike characters (no 0/o, 1/l/i), so the ID is easy to read and type.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';


// create the random string
function randomString(length: number): string {

    let out = '';

    for (let i = 0; i < length; i++) {
        // use the random int 
        out += ALPHABET[randomInt(ALPHABET.length)];
    }
    return out;
};

/** Public Homies ID shown to the user and to experts in chat. Example: @homies_k7x2q9 */
export function generateHomieId(): string {
    return `@homies_${randomString(6)}`;
}

/** Anonymous name show to other user and posts, Homie-K7X2Q9*/
export function generateAnonymousAlias(): string {
    return `Homie-${randomString(6).toUpperCase()}`
}

