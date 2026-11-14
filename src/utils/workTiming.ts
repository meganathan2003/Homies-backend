// Accepts: "9AM to 5PM", "9 am - 5 pm", "9:30AM to 5:30PM", "10PM to 6AM" (night shift is fine).
const TIME = '(1[0-2]|0?[1-9])(?::([0-5]\\d))?\\s*([ap]m)';
const PATTERN = new RegExp(`^${TIME}\\s*(?:to|-|\u2013)\\s*${TIME}$`, 'i');

export interface WorkTiming {
    /** Clean text we store and send back to the app, e.g. "9AM to 5PM" */
    label: string;
    /** Minutes since midnight (0-1439), handy later for sorting or availability checks */
    startMinutes: number;
    endMinutes: number;
}

function part(hour: string, minute: string | undefined, period: string) {
    const h = Number(hour);
    const m = minute ? Number(minute) : 0;
    const p = period.toUpperCase();
    return {
        text: `${h}${m ? `:${String(m).padStart(2, '0')}` : ''}${p}`,
        minutes: ((h % 12) + (p === 'PM' ? 12 : 0)) * 60 + m,
    };
}

/** Returns null when the text is not a valid "start to end" time range. */
export function parseWorkTiming(input: string): WorkTiming | null {
    const match = PATTERN.exec(input.trim());
    if (!match) return null;
    const [, h1, m1, p1, h2, m2, p2] = match as unknown as [string, string, string | undefined, string, string, string | undefined, string];
    const start = part(h1, m1, p1);
    const end = part(h2, m2, p2);
    if (start.minutes === end.minutes) return null; // "9AM to 9AM" makes no sense
    return { label: `${start.text} to ${end.text}`, startMinutes: start.minutes, endMinutes: end.minutes };
}