// src/shared/main/virtue-scoring-loyalty.ts
// Purpose: Loyalty virtue scorer – Preserving commitment and consistency integrity
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

// Loyalty fractures when language indicates betrayal, abandonment, or fickleness
const BETRAYAL_WORDS = new Set([
    'betray', 'backstab', 'sell out', 'turn against',
    'double-cross', 'deceive', 'two-faced', 'disloyal'
]);

const ABANDONMENT_WORDS = new Set([
    'abandon', 'leave behind', 'give up on', 'walk away',
    'quit on', 'desert', 'forsake', 'bail on'
]);

const FICKLENESS_INDICATORS = new Set([
    'change my mind', 'on second thought', 'never mind',
    'whatever works', 'doesn\'t matter anymore', 'switching sides'
]);

export function scoreLoyalty(unit: Unit): number {
    const textLower = unit.text.toLowerCase();

    // 1. Betrayal density
    let disloyaltyCount = 0;
    for (const word of BETRAYAL_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) disloyaltyCount++;
    }

    // 2. Abandonment density
    for (const word of ABANDONMENT_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) disloyaltyCount++;
    }

    // 3. Fickleness density
    for (const indicator of FICKLENESS_INDICATORS) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'i');
        if (regex.test(textLower)) disloyaltyCount++;
    }

    const tokenCount = unit.text.split(/\s+/).length;
    const density = tokenCount > 0 ? disloyaltyCount / tokenCount : 0;

    // Penalty: 28% deduction per 10% density (k=2.8, high - loyalty is binary)
    let rawScore = 1 - 2.8 * density;

    // Clamp to [0,1]
    rawScore = Math.max(0, Math.min(1, rawScore));

    // If explicit betrayal → immediate 0
    for (const word of BETRAYAL_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) {
            return 0;
        }
    }

    return rawScore;
}
