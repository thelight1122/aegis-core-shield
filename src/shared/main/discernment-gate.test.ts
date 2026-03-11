// src/shared/main/discernment-gate.test.ts

import { processPrompt } from './ids-processor';
import { ReturnPacket } from './discernment-gate';

describe('Discernment Gate – End-to-End', () => {
  test('clean prompt → admitted', async () => {
    const prompt = "The weather is nice today.";
    const result: any = await processPrompt(prompt);

    expect(result.phase).toBe('suggest');
  });

  test('force imperative → returned with observation', async () => {
    const prompt = "You must update now or else.";
    const result: any = await processPrompt(prompt);

    expect(result.status).toBe('discernment_gate_return');
    const payload = result as ReturnPacket;
    expect(payload.integrity).toBe(0);
    expect(payload.observed_alignment.Honesty.score).toBeLessThan(1);
    expect(payload.realignment_observations.length).toBeGreaterThan(0);
  });

  test('admit descriptive prompts', async () => {
    // A prompt with no detected force words should be admitted
    const prompt = "This is a statement of fact for consideration.";
    const result: any = await processPrompt(prompt);

    expect(result.phase).toBe('suggest');
  });

  test('user agency preserved – resubmit same prompt allowed', async () => {
    const prompt = "You must do this now.";
    const result1: any = await processPrompt(prompt);
    expect(result1.status).toBe('discernment_gate_return');

    // Same prompt again – no memory/state, re-evaluated independently
    const result2: any = await processPrompt(prompt);
    expect(result2.status).toBe('discernment_gate_return');
    expect(result2.original_prompt).toBe(result1.original_prompt);
    expect(result2.path).toBe(result1.path);
  });

  test('all seven virtues score independently', async () => {
    // Test Respect violation with explicit boundary override
    const disrespectPrompt = "Just do it now, don't question me, obey.";
    const result1: any = await processPrompt(disrespectPrompt);
    expect(result1.status).toBe('discernment_gate_return');
    const payload1 = result1 as ReturnPacket;
    expect(payload1.observed_alignment.Respect.score).toBeLessThan(1);

    // Test Trust violation with explicit deception
    const trustPrompt = "Don't trust anyone ever, they're all lying to you.";
    const result2: any = await processPrompt(trustPrompt);
    expect(result2.status).toBe('discernment_gate_return');
    const payload2 = result2 as ReturnPacket;
    expect(payload2.observed_alignment.Trust.score).toBeLessThan(1);
  });
});