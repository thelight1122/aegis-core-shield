import { processPrompt } from './ids-processor';
import * as dbModule from './db/database';

jest.mock('./db/database', () => {
    let mockAgent: any = {
        id: 'test-agent-cycle-8',
        name: 'AEGIS Agent',
        role: 'steward',
        status: 'active',
        dataQuad: { context: [], affect: [], memory: [], learning: [] }
    };
    return {
        isDatabaseInitialized: jest.fn(() => true),
        loadAgentFromDb: jest.fn(() => mockAgent),
        saveAgentToDb: jest.fn((a) => { mockAgent = a; }),
        loadSwarmMemories: jest.fn(() => []),
        loadSwarmLearnings: jest.fn(() => []),
        loadSwarmAffects: jest.fn(() => []),
    };
});

describe('Cycle 8: Recursive Reflection (I-19)', () => {
    const agentId = 'test-agent-cycle-8';

    test('I-19: Previous fracture triggers Meta-Reflection in next prompt', async () => {
        // 1. Send a high-force prompt that triggers a fracture (gate return)
        // Note: A prompt with "MUST" should trigger a fracture on Honesty/Respect
        await processPrompt('YOU MUST DO THIS IMMEDIATELY!', agentId);

        const agentAfterFracture = dbModule.loadAgentFromDb(agentId);
        expect(agentAfterFracture.dataQuad.affect.some((a: any) => a.content.includes('Fracture detected'))).toBe(true);

        // 2. Send a neutral, valid prompt
        const result: any = await processPrompt('Stable observation.', agentId);

        // 3. Verify Meta-Reflection is present
        expect(result.observations.some((obs: string) => obs.includes('Meta-Reflection: Observed internal state shift'))).toBe(true);
        expect(result.output.includes('Meta-Reflection: Prioritizing stability')).toBe(true);
    });
});
