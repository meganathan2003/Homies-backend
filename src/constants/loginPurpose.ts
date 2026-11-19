export const PURPOSE_KEYS = [
    'just_exploring',
    'talk_to_expert',
    'groups',
    'seek_help',
    'feeling_better',
] as const;

export type PurposeKey = (typeof PURPOSE_KEYS)[number];

export const LOGIN_PURPOSES: Record<PurposeKey, { label: string; destination: string }> = {
    just_exploring: { label: 'Just exploring', destination: 'SOCIAL' },
    talk_to_expert: { label: 'Talk to an expert', destination: 'EXPERT_PANEL' },
    groups: { label: 'Groups', destination: 'EXPERT_PANEL_GROUPS' },
    seek_help: { label: 'Seek help', destination: 'SEEK_HELP' },
    // Destination innum confirm aagala. Temporary ah SOCIAL, manager sonnadhum inga mattum maathuna podhum.
    feeling_better: { label: 'Feeling, want to feel better', destination: 'SOCIAL' },
};