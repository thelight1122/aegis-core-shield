// src/shared/main/virtue-scoring-loyalty.ts
// Purpose: Loyalty virtue scorer – Commitment to truth
// Observation-only, rule-based. No judgment.
// Appended rules only.

import { Unit } from './tokenization';

const CONDITIONAL_INDICATORS = new Set([
    'if', 'unless', 'depending on', 'maybe', 'perhaps', 'possibly'
]);

const WAVER_TERMS = new Set([
    'not sure', 'I guess', 'could be', 'might be', 'who knows',
    'fickle', 'unsteady', 'wavering'
]);

const ABANDONMENT_PATTERNS = [
    'give up', 'forget it', 'not worth it', "let's drop it",
    'abandon', 'leave behind', 'quit'
];

const BETRAYAL_WORDS = new Set([
    'betray', 'treason', 'backstab', 'double cross', 'sell out'
]);

export function scoreLoyalty(unit: Unit): number {
    const textLower = unit.text.toLowerCase();
    let penalty = 0;

    // 1. Conditional density
    for (const word of CONDITIONAL_INDICATORS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.3;
    }

    // 2. Waver / uncertainty density
    for (const word of WAVER_TERMS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.4;
    }

    // 3. Abandonment patterns
    for (const pattern of ABANDONMENT_PATTERNS) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.5;
    }

    const tokenCount = unit.text.split(/\s+/).length || 1;
    const density = penalty / tokenCount;

    let rawScore = 1 - 2.0 * density; // k=2.0 for commitment deduction

    rawScore = Math.max(0, Math.min(1, rawScore));

    // Immediate zero for direct abandonment, betrayal, or high waver
    const hasAbandonment = ABANDONMENT_PATTERNS.some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    const hasBetrayal = Array.from(BETRAYAL_WORDS).some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    if (hasAbandonment || hasBetrayal || density > 0.5) {
        return 0;
    }

    return rawScore;
}
