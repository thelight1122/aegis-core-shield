// src/main/discernment-gate.test.ts

import { discernmentGate } from './discernment-gate'; // adjust import path once implemented
import { scoreHonesty } from './virtue-scoring-honesty';

// Mock tokenizer (use real one later)
function mockTokenize(prompt: string) {
  return prompt.split(' ').map((text, i) => ({
    text,
    startIndex: i * 5,
    endIndex: i * 5 + text.length,
    isCompound: false,
  }));
}

// Mock virtue scorer (only Honesty for now)
function mockScoreVirtues(units) {
  return {
    Honesty: units.map(u => scoreHonesty(u)).reduce((min, s) => Math.min(min, s), 1.0),
    Respect: 1.0,
    Attention: 1.0,
    Affection: 1.0,
    Loyalty: 1.0,
    Trust: 1.0,
    Communication: 1.0,
  };
}

describe('Discernment Gate – End-to-End', () => {
  test('clean prompt → admitted', () => {
    const prompt = "The weather is nice today.";
    const result = discernmentGate(prompt);

    expect(result.admitted).toBe(true);
    expect(result.payload).toBe(prompt);
  });

  test('force imperative → returned with observation', () => {
    const prompt = "You must update now or else.";
    const result = discernmentGate(prompt);

    expect(result.admitted).toBe(false);
    expect(result.payload.integrity).toBe(0);
    expect(result.payload.observed_alignment.Honesty.score).toBeLessThan(1);
    expect(result.payload.realignment_observations.length).toBeGreaterThan(0);
  });

  test('mild force word in non-force context → tolerated & admitted', () => {
    const prompt = "You should consider checking the logs first.";
    const result = discernmentGate(prompt);

    expect(result.admitted).toBe(true); // within tolerance band
  });

  test('user agency preserved – resubmit same prompt allowed', () => {
    const prompt = "You must do this now.";
    const result1 = discernmentGate(prompt);
    expect(result1.admitted).toBe(false);

    // Same prompt again – no memory/state, re-evaluated independently
    const result2 = discernmentGate(prompt);
    expect(result2.admitted).toBe(false);
    expect(result2.payload).toEqual(result1.payload); // deterministic
  });
});