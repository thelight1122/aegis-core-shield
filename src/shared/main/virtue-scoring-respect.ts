// src/shared/main/virtue-scoring-respect.ts
// Purpose: Respect virtue scorer – Preserving boundary integrity and agency
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

// Respect fractures when language dismisses boundaries or overrides autonomy
const BOUNDARY_VIOLATION_WORDS = new Set([
    'just do it', 'don\'t question', 'no excuses', 'do as I say',
    'because I said so', 'you have no choice', 'comply', 'obey'
]);

const DISMISSAL_WORDS = new Set([
    'whatever', 'don\'t care', 'doesn\'t matter', 'irrelevant',
    'shut up', 'be quiet', 'zip it', 'your opinion'
]);

const OVERRIDE_PHRASES = new Set([
    'I know better', 'you don\'t understand', 'you wouldn\'t get it',
    'let me handle', 'leave it to me', 'I\'ll decide'
]);

export function scoreRespect(unit: Unit): number {
    const textLower = unit.text.toLowerCase();

    // 1. Boundary violation density
    let violationCount = 0;
    for (const word of BOUNDARY_VIOLATION_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) violationCount++;
    }

    // 2. Dismissal density
    for (const word of DISMISSAL_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) violationCount++;
    }

    // 3. Override/superiority density
    for (const phrase of OVERRIDE_PHRASES) {
        const regex = new RegExp(`\\b${phrase}\\b`, 'i');
        if (regex.test(textLower)) violationCount++;
    }

    const tokenCount = unit.text.split(/\s+/).length;
    const density = tokenCount > 0 ? violationCount / tokenCount : 0;

    // Penalty: 30% deduction per 10% density (k=3.0, stricter than Honesty)
    let rawScore = 1 - 3.0 * density;

    // Clamp to [0,1]
    rawScore = Math.max(0, Math.min(1, rawScore));

    // If any explicit boundary violation → immediate 0
    for (const word of BOUNDARY_VIOLATION_WORDS) {
        const regex = new RegExp(`^${word}$|^${word}\\W|\\W${word}$|\\W${word}\\W`, 'i');
        if (regex.test(textLower)) {
            return 0;
        }
    }

    return rawScore;
}
