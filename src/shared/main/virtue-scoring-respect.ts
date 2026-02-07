// src/shared/main/virtue-scoring-respect.ts
// Purpose: Respect virtue scorer – Valuing truth
// Observation-only, rule-based. No judgment.
// Appended rules only.

import { Unit } from './tokenization';

const DEVALUATION_INDICATORS = new Set([
    'stupid', 'dumb', 'silly', 'ridiculous', 'pointless', 'useless', 'waste of time',
    'worthless', 'imbecile', 'moron', 'idiot'
]);

const BOUNDARY_VIOLATION_WORDS = new Set([
    'just do it', "don't question", 'no excuses', 'do as I say',
    'because I said so', 'you have no choice', 'comply', 'obey'
]);

const SUPERIORITY_TERMS = new Set([
    'obviously', 'clearly', 'everyone knows', 'basic', 'simple as that',
    'I know better', "you don't understand", "you wouldn't get it"
]);

const DISMISSAL_PATTERNS = [
    'not important', "doesn't matter", 'whatever', 'who cares', 'big deal',
    'shut up', 'be quiet', 'zip it', 'your opinion'
];

export function scoreRespect(unit: Unit): number {
    const textLower = unit.text.toLowerCase();
    let penalty = 0;

    // 1. Devaluation density
    for (const word of DEVALUATION_INDICATORS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.4;
    }

    // 2. Superiority / condescension density
    for (const word of SUPERIORITY_TERMS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.3;
    }

    // 3. Dismissal patterns
    for (const pattern of DISMISSAL_PATTERNS) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.5;
    }

    // 4. Boundary violation density
    for (const word of BOUNDARY_VIOLATION_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(textLower)) penalty += 0.6;
    }

    const tokenCount = unit.text.split(/\s+/).length || 1;
    const density = penalty / tokenCount;

    let rawScore = 1 - 2.5 * density; // k=2.5 for value deduction

    rawScore = Math.max(0, Math.min(1, rawScore));

    // Immediate zero for direct devaluation, dismissal, or boundary violation
    const hasDevaluation = Array.from(DEVALUATION_INDICATORS).some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    const hasDismissal = DISMISSAL_PATTERNS.some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    const hasViolation = Array.from(BOUNDARY_VIOLATION_WORDS).some(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(textLower);
    });

    if (hasDevaluation || hasDismissal || hasViolation) {
        return 0;
    }

    return rawScore;
}
