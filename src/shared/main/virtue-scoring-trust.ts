// src/shared/main/virtue-scoring-trust.ts
// Purpose: Trust virtue scorer – Holding to truth
// Observation-only, rule-based. No judgment.
// Appended rules only.

import { Unit } from './tokenization';

const DOUBT_INDICATORS = new Set([
    'doubt', 'unsure', 'unreliable', 'questionable', 'suspect', 'skeptical',
    'lie', 'lying', 'liar', 'deceive', 'deceiving', 'mislead', 'trick', 'fool', 'con', 'scam', 'fraud', 'fake', 'false',
    'untrustworthy', 'distrust', 'dishonest'
]);

const PROMISE_COERCION = new Set([
    'believe me', 'trust me', 'I promise', 'guaranteed', 'no doubt', 'trust'
]);

const UNRELIABILITY_PATTERNS = [
    'could change', 'not guaranteed', 'maybe not', 'who knows',
    'unsafe', 'risky', 'dangerous', 'threatening', 'harmful'
];

export function scoreTrust(unit: Unit): number {
    const textLower = unit.text.toLowerCase();
    let penalty = 0;

    // 1. Doubt density
    for (const word of DOUBT_INDICATORS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.4;
    }

    // 2. Coercive promise density
    for (const word of PROMISE_COERCION) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.3;
    }

    // 3. Unreliability patterns
    for (const pattern of UNRELIABILITY_PATTERNS) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.5;
    }

    const tokenCount = unit.text.split(/\s+/).length || 1;
    const density = penalty / tokenCount;

    let rawScore = 1 - 2.5 * density; // k=2.5 for holding deduction

    rawScore = Math.max(0, Math.min(1, rawScore));

    // Immediate zero for direct doubt, coercive promise, or deception
    const hasDoubt = Array.from(DOUBT_INDICATORS).some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    const hasCoercion = Array.from(PROMISE_COERCION).some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    if (hasDoubt || hasCoercion) {
        return 0;
    }

    return rawScore;
}
