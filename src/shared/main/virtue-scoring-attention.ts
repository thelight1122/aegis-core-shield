// src/shared/main/virtue-scoring-attention.ts
// Purpose: Attention virtue scorer – Preserving focus and presence integrity
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

// Attention fractures when language indicates distraction, rushing, or absence
const DISTRACTION_WORDS = new Set([
    'whatever', 'anyway', 'moving on', 'next', 'skip this',
    'don\'t worry about', 'forget about', 'ignore that'
]);

const RUSHING_WORDS = new Set([
    'hurry', 'quick', 'asap', 'immediately', 'right now', 'urgent',
    'rush', 'fast', 'no time', 'deadline'
]);

const ABSENCE_INDICATORS = new Set([
    'not listening', 'not paying attention', 'zoned out',
    'half listening', 'multitasking', 'busy with'
]);

export function scoreAttention(unit: Unit): number {
    const textLower = unit.text.toLowerCase();

    // 1. Distraction density
    let inattentionCount = 0;
    for (const word of DISTRACTION_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) inattentionCount++;
    }

    // 2. Rushing/pressure density
    for (const word of RUSHING_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) inattentionCount++;
    }

    // 3. Explicit absence indicators
    for (const indicator of ABSENCE_INDICATORS) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'i');
        if (regex.test(textLower)) inattentionCount++;
    }

    const tokenCount = unit.text.split(/\s+/).length;
    const density = tokenCount > 0 ? inattentionCount / tokenCount : 0;

    // Penalty: 25% deduction per 10% density (k=2.5, balanced)
    let rawScore = 1 - 2.5 * density;

    // Clamp to [0,1]
    rawScore = Math.max(0, Math.min(1, rawScore));

    // If explicit absence statement → immediate 0
    for (const indicator of ABSENCE_INDICATORS) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'i');
        if (regex.test(textLower)) {
            return 0;
        }
    }

    return rawScore;
}
