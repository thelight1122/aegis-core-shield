// src/shared/main/virtue-scoring-attention.ts
// Purpose: Attention virtue scorer – Acknowledging truth
// Observation-only, rule-based. No judgment.
// Appended rules only.

import { Unit } from './tokenization';

const IGNORING_INDICATORS = new Set([
    'ignore', 'ignoring', 'skip', 'skipped', 'forget about', "don't worry about", 'not relevant',
    'next', 'whatever'
]);

const BYPASS_PATTERNS = [
    'anyway', 'regardless', 'moving on', "let's skip", 'not important'
];

const DISTRACTION_TERMS = new Set([
    'off topic', 'besides the point', 'tangent', 'side note',
    'zoned out', 'half listening', 'multitasking', 'busy with'
]);

const RUSHING_WORDS = new Set([
    'hurry', 'quick', 'asap', 'immediately', 'right now', 'urgent',
    'rush', 'fast', 'no time', 'deadline'
]);

export function scoreAttention(unit: Unit): number {
    const textLower = unit.text.toLowerCase();
    let penalty = 0;

    // 1. Ignoring density
    for (const word of IGNORING_INDICATORS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.5;
    }

    // 2. Bypass patterns
    for (const pattern of BYPASS_PATTERNS) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.4;
    }

    // 3. Distraction terms
    for (const word of DISTRACTION_TERMS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.3;
    }

    // 4. Rushing terms
    for (const word of RUSHING_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.4;
    }

    const tokenCount = unit.text.split(/\s+/).length || 1;
    const density = penalty / tokenCount;

    let rawScore = 1 - 2.0 * density; // k=2.0 for acknowledgment deduction

    rawScore = Math.max(0, Math.min(1, rawScore));

    // Immediate zero for direct ignoring or bypass
    const hasIgnoring = Array.from(IGNORING_INDICATORS).some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    const hasBypass = BYPASS_PATTERNS.some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    if (hasIgnoring || hasBypass) {
        return 0;
    }

    return rawScore;
}
