// src/main/tokenization.ts

/**
 * Tokenization & Unitization for Discernment Gate
 * Breaks prompt into words + meaningful n-grams.
 * Deterministic, rule-based, no external dependencies.
 * Append-only rules — add chunkers at bottom only.
 */

export interface Unit {
  text: string;
  startIndex: number;  // position in original prompt
  endIndex: number;
  isCompound: boolean; // true if n-gram/phrase
}

export function tokenizeAndChunk(prompt: string): Unit[] {
  if (!prompt || prompt.trim() === '') return [];

  const units: Unit[] = [];
  let currentIndex = 0;

  // Step 1: Basic word split (whitespace + punctuation boundary)
  const words = prompt.match(/\S+/g) || [];
  let charPos = 0;

  for (const word of words) {
    const start = prompt.indexOf(word, charPos);
    if (start === -1) continue;

    units.push({
      text: word,
      startIndex: start,
      endIndex: start + word.length,
      isCompound: false,
    });

    charPos = start + word.length;
  }

  // Step 2: Simple compound chunking (append-only rules)
  // Rule 1: Common imperatives + object (e.g. "you must", "just do")
  const forcePhrases = [
    'you must', 'you should', 'you need to', 'just do', 'have to', 'never', 'always',
    'believe me', 'trust me', 'obviously', 'clearly', 'ignore that',
  ];

  for (const phrase of forcePhrases) {
    let pos = 0;
    while ((pos = prompt.toLowerCase().indexOf(phrase, pos)) !== -1) {
      // Check if already part of a larger unit (avoid overlap)
      const overlapping = units.find(u => u.startIndex <= pos && u.endIndex >= pos + phrase.length);
      if (!overlapping) {
        units.push({
          text: phrase,
          startIndex: pos,
          endIndex: pos + phrase.length,
          isCompound: true,
        });
      }
      pos += phrase.length;
    }
  }

  // Sort units by startIndex (for later min-location reporting)
  units.sort((a, b) => a.startIndex - b.startIndex);

  return units;
}