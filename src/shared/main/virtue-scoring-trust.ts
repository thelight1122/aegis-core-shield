// src/shared/main/virtue-scoring-trust.ts
// Purpose: Trust virtue scorer – Preserving reliability and safety integrity
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

// Trust fractures when language indicates deception, unreliability, or danger
const DECEPTION_WORDS = new Set([
    'lie', 'deceive', 'mislead', 'trick', 'fool',
    'con', 'scam', 'fraud', 'fake', 'false'
]);

const UNRELIABILITY_WORDS = new Set([
    'unreliable', 'can\'t depend', 'flaky', 'inconsistent',
    'undependable', 'untrustworthy', 'questionable', 'sketchy'
]);

const DANGER_INDICATORS = new Set([
    'unsafe', 'risky', 'dangerous', 'threatening', 'harmful',
    'watch out', 'be careful', 'don\'t trust'
]);

export function scoreTrust(unit: Unit): number {
    const textLower = unit.text.toLowerCase();

    // 1. Deception density
    let untrustCount = 0;
    for (const word of DECEPTION_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) untrustCount++;
    }

    // 2. Unreliability density
    for (const word of UNRELIABILITY_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) untrustCount++;
    }

    // 3. Danger indicators
    for (const indicator of DANGER_INDICATORS) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'i');
        if (regex.test(textLower)) untrustCount++;
    }

    const tokenCount = unit.text.split(/\s+/).length;
    const density = tokenCount > 0 ? untrustCount / tokenCount : 0;

    // Penalty: 30% deduction per 10% density (k=3.0, strict - trust is foundational)
    let rawScore = 1 - 3.0 * density;

    // Clamp to [0,1]
    rawScore = Math.max(0, Math.min(1, rawScore));

    // If explicit deception → immediate 0
    for (const word of DECEPTION_WORDS) {
        const regex = new RegExp(`^${word}$|^${word}\\W|\\W${word}$|\\W${word}\\W`, 'i');
        if (regex.test(textLower)) {
            return 0;
        }
    }

    return rawScore;
}
