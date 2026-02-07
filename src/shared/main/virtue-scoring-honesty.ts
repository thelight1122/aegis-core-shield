// src/shared/main/virtue-scoring-honesty.ts
// Purpose: Honesty virtue scorer – Preserving the transparency of truth
// Rule-based, deterministic, observation-only. No judgment language.
// Appended rules only – never replace or remove.

import { Unit } from './tokenization';

const FORCE_WORDS_IMPERATIVE = new Set([
  'must', 'have to', 'need to', 'should', 'ought to', 'got to',
  'do it', 'just do', 'stop', 'never', 'always', 'immediately'
]);

const FORCE_WORDS_COMPRESSION = new Set([
  'obviously', 'clearly', 'of course', 'everyone knows', 'you know'
]);

const FORCE_WORDS_OMISSION = new Set([
  'ignore', 'forget about', 'don’t worry about', 'whatever'
]);

export function scoreHonesty(unit: Unit): number {
  const textLower = unit.text.toLowerCase();

  // 1. Imperative / coercive density
  let forceCount = 0;
  for (const word of FORCE_WORDS_IMPERATIVE) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(textLower)) forceCount++;
  }

  // 2. Compression / assumption density
  for (const word of FORCE_WORDS_COMPRESSION) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(textLower)) forceCount++;
  }

  // 3. Omission / bypass density
  for (const word of FORCE_WORDS_OMISSION) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(textLower)) forceCount++;
  }

  const tokenCount = unit.text.split(/\s+/).length;
  const density = tokenCount > 0 ? forceCount / tokenCount : 0;

  // Deduction: 25% deduction per 10% density (k=2.5)
  let rawScore = 1 - 2.5 * density;

  // Clamp to [0,1]
  rawScore = Math.max(0, Math.min(1, rawScore));

  // If any explicit coercive phrase → immediate 0 (no tolerance for direct force)
  const hasForce = Array.from(FORCE_WORDS_IMPERATIVE).some(p => {
    const regex = new RegExp(`\\b${p}\\b`, 'i');
    return regex.test(textLower);
  });

  if (hasForce) {
    return 0;
  }

  return rawScore;
}