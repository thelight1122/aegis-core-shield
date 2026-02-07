// src/shared/main/virtue-scoring-communication.ts
// Purpose: Communication virtue scorer – Conveying truth clearly and without ambiguity
// Observation-only, rule-based. No judgment.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

const AMBIGUITY_INDICATORS = new Set([
    'maybe', 'perhaps', 'possibly', 'kind of', 'sort of', 'somewhat',
    'you know', 'like', 'um', 'uh', 'basically', 'literally'
]);

const EVASION_PATTERNS = [
    'it depends', 'hard to say', 'not sure', 'I guess', 'probably',
    'could be', 'might be', 'who knows'
];

const OVERLOAD_TERMS = new Set([
    'etc', 'and so on', 'blah blah', 'you get the idea', 'whatever'
]);

export function scoreCommunication(unit: Unit): number {
    const textLower = unit.text.toLowerCase();
    let penalty = 0;

    // 1. Ambiguity / filler density
    for (const word of AMBIGUITY_INDICATORS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.3;
    }

    // 2. Evasion / deflection patterns
    for (const pattern of EVASION_PATTERNS) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.5;
    }

    // 3. Overload / truncation density
    for (const word of OVERLOAD_TERMS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.4;
    }

    const tokenCount = unit.text.split(/\s+/).length || 1;
    const density = penalty / tokenCount;

    // Penalty: k=2.0 → 10% density costs 0.20 points
    let rawScore = 1 - 2.0 * density;

    rawScore = Math.max(0, Math.min(1, rawScore));

    // Immediate zero for direct evasion or overload
    const hasEvasion = EVASION_PATTERNS.some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    if (hasEvasion || textLower.includes('etc.')) {
        return 0;
    }

    return rawScore;
}
