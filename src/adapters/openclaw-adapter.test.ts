import { createHash } from 'crypto';

import { buildDataQuadSnapshot, processOpenClawEvent } from './openclaw-adapter';

describe('OpenClaw adapter', () => {
  test('buildDataQuadSnapshot fills missing dimensions with empty arrays', () => {
    const snapshot = buildDataQuadSnapshot({
      agentId: 'agent-1',
      sessionId: 'session-1',
      requestId: 'req-1',
      prompt: 'The weather is nice today.',
      dataquad: { temporal: ['t1'] },
    });

    expect(snapshot.temporal).toEqual(['t1']);
    expect(snapshot.contextual).toEqual([]);
    expect(snapshot.affective).toEqual([]);
    expect(snapshot.reflective).toEqual([]);
  });

  test('processOpenClawEvent hashes prompt by default', () => {
    const prompt = 'The weather is nice today.';
    const expectedHash = `sha256:${createHash('sha256').update(prompt).digest('hex')}`;

    const result = processOpenClawEvent({
      agentId: 'agent-2',
      sessionId: 'session-2',
      requestId: 'req-2',
      prompt,
      toolIntent: 'repo.search',
    });

    expect(result.input.prompt_hash).toBe(expectedHash);
  });

  test('processOpenClawEvent can disable prompt hashing', () => {
    const result = processOpenClawEvent(
      {
        agentId: 'agent-3',
        sessionId: 'session-3',
        requestId: 'req-3',
        prompt: 'The weather is nice today.',
      },
      { hashPrompt: false }
    );

    expect(result.input.prompt_hash).toBeUndefined();
  });

  test('processOpenClawEvent includes IDS output only when prompt is admitted', () => {
    const admitted = processOpenClawEvent({
      agentId: 'agent-4',
      sessionId: 'session-4',
      requestId: 'req-4a',
      prompt: 'The weather is nice today.',
    });

    expect(admitted.gate.admitted).toBe(true);
    expect(admitted.ids).toBeDefined();

    const returned = processOpenClawEvent({
      agentId: 'agent-4',
      sessionId: 'session-4',
      requestId: 'req-4b',
      prompt: 'You must do this now.',
    });

    expect(returned.gate.admitted).toBe(false);
    expect(returned.ids).toBeUndefined();
  });
});
