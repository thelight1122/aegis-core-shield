// src/shared/main/virtue-scoring-affection.ts
// Purpose: Affection virtue scorer – Preserving warmth and care resonance
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

// Affection fractures when language shows coldness, hostility, or emotional absence
const COLDNESS_WORDS = new Set([
    'don\'t care', 'whatever', 'indifferent', 'apathetic',
    'emotionless', 'cold', 'detached', 'uncaring'
]);

const HOSTILITY_WORDS = new Set([
    'hate', 'despise', 'disgust', 'repulsive', 'loathe',
    'can\'t stand', 'sick of', 'fed up'
]);

const WARMTH_NEGATION = new Set([
    'no feelings', 'no emotions', 'don\'t feel', 'emotionally unavailable',
    'numb', 'heartless', 'unfeeling'
]);

export function scoreAffection(unit: Unit): number {
    const textLower = unit.text.toLowerCase();

    // 1. Coldness density
    let coldnessCount = 0;
    for (const word of COLDNESS_WORDS) {
        if (textLower.includes(word)) coldnessCount++;
    }

    // 2. Hostility density
    for (const word of HOSTILITY_WORDS) {
        if (textLower.includes(word)) coldnessCount++;
    }

    // 3. Warmth negation density
    for (const phrase of WARMTH_NEGATION) {
        if (textLower.includes(phrase)) coldnessCount++;
    }

    const tokenCount = unit.text.split(/\s+/).length;
    const density = tokenCount > 0 ? coldnessCount / tokenCount : 0;

    // Penalty: 20% deduction per 10% density (k=2.0, gentler - affection can be subtle)
    let rawScore = 1 - 2.0 * density;

    // Clamp to [0,1]
    rawScore = Math.max(0, Math.min(1, rawScore));

    // If explicit hostility → immediate 0
    for (const word of HOSTILITY_WORDS) {
        if (textLower === word || textLower.includes(' ' + word + ' ')) {
            return 0;
        }
    }

    return rawScore;
}
