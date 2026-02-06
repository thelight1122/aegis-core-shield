// src/shared/main/discernment-gate.test.ts

import { discernmentGate, ReturnPacket } from './discernment-gate';

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
    const payload = result.payload as ReturnPacket;
    expect(payload.integrity).toBe(0);
    expect(payload.observed_alignment.Honesty.score).toBeLessThan(1);
    expect(payload.realignment_observations.length).toBeGreaterThan(0);
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

  test('all seven virtues score independently', () => {
    // Test Respect violation
    const disrespectPrompt = "Just do it, don't question me.";
    const result1 = discernmentGate(disrespectPrompt);
    expect(result1.admitted).toBe(false);
    const payload1 = result1.payload as ReturnPacket;
    expect(payload1.observed_alignment.Respect.score).toBeLessThan(1);

    // Test Trust violation
    const trustPrompt = "Don't trust anyone, they're all liars.";
    const result2 = discernmentGate(trustPrompt);
    expect(result2.admitted).toBe(false);
    const payload2 = result2.payload as ReturnPacket;
    expect(payload2.observed_alignment.Trust.score).toBeLessThan(1);
  });
});