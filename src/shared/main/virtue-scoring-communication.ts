// src/shared/main/virtue-scoring-communication.ts
// Purpose: Communication virtue scorer – Preserving clarity and openness integrity
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

// Communication fractures when language is unclear, closed, or obfuscated
const CLARITY_VIOLATIONS = new Set([
    'confusing', 'unclear', 'vague', 'ambiguous',
    'muddy', 'obscure', 'cryptic', 'convoluted'
]);

const CLOSURE_WORDS = new Set([
    'shut down', 'close off', 'stop talking', 'end discussion',
    'no more questions', 'final answer', 'case closed', 'that\'s it'
]);

const OBFUSCATION_INDICATORS = new Set([
    'intentionally vague', 'don\'t want to say', 'can\'t tell you',
    'secret', 'confidential', 'off the record', 'between us'
]);

export function scoreCommunication(unit: Unit): number {
    const textLower = unit.text.toLowerCase();

    // 1. Clarity violation density
    let blockageCount = 0;
    for (const word of CLARITY_VIOLATIONS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) blockageCount++;
    }

    // 2. Closure density
    for (const word of CLOSURE_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) blockageCount++;
    }

    // 3. Obfuscation density
    for (const indicator of OBFUSCATION_INDICATORS) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'i');
        if (regex.test(textLower)) blockageCount++;
    }

    const tokenCount = unit.text.split(/\s+/).length;
    const density = tokenCount > 0 ? blockageCount / tokenCount : 0;

    // Penalty: 25% deduction per 10% density (k=2.5, balanced)
    let rawScore = 1 - 2.5 * density;

    // Clamp to [0,1]
    rawScore = Math.max(0, Math.min(1, rawScore));

    // If explicit closure → immediate 0
    for (const word of CLOSURE_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) {
            return 0;
        }
    }

    return rawScore;
}
