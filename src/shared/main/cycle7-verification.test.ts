import { processPrompt } from './ids-processor';
import * as dbModule from './db/database';

jest.mock('./db/database', () => {
    let mockAgent: any = null;
    return {
        isDatabaseInitialized: jest.fn(() => true),
        loadAgentFromDb: jest.fn(() => mockAgent),
        saveAgentToDb: jest.fn((a) => { mockAgent = a; }),
        loadSwarmMemories: jest.fn(() => []),
        loadSwarmLearnings: jest.fn(() => []),
        loadSwarmAffects: jest.fn(() => []),
    };
});

describe('Cycle 7: Temporal Distillation (I-17/I-18)', () => {
    const agentId = 'test-agent-cycle-7';

    test('I-17/I-18: Memory is pruned after MAX_ENTRIES and compressed', async () => {
        // 1. Fill memory with 20 entries (one by one)
        for (let i = 0; i < 20; i++) {
            await processPrompt(`Stable observation ${i}`, agentId);
        }

        const agentAfter20 = dbModule.loadAgentFromDb(agentId);
        expect(agentAfter20.dataQuad.memory.length).toBe(20);

        // 2. Add the 21st entry. This should trigger distillation.
        // It will prune 10 entries, leaving 10 + 1 (the new one) = 11.
        await processPrompt('The 21st entry triggering entropy management.', agentId);

        const agentAfterDistillation = dbModule.loadAgentFromDb(agentId);

        // Memory should be 11 (20 - 10 + 1)
        expect(agentAfterDistillation.dataQuad.memory.length).toBe(11);

        // Learning should have a compression summary
        expect(agentAfterDistillation.dataQuad.learning.some((l: any) =>
            l.content.includes('Temporal Distillation: Compressed 10 memory entries')
        )).toBe(true);
    });
});
