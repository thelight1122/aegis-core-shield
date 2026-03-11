import { processPrompt } from './ids-processor';
import * as dbModule from './db/database';

jest.mock('./db/database', () => {
    const mockStorage: Record<string, any> = {};
    return {
        isDatabaseInitialized: jest.fn(() => true),
        loadAgentFromDb: jest.fn((id) => mockStorage[id] || null),
        saveAgentToDb: jest.fn((agent) => { mockStorage[agent.id] = agent; }),
        loadSwarmMemories: jest.fn((swarmId) => {
            const memories: any[] = [];
            Object.values(mockStorage).forEach(agent => {
                if (agent.swarmId === swarmId) memories.push(...agent.dataQuad.memory);
            });
            return memories;
        }),
        loadSwarmLearnings: jest.fn((swarmId) => {
            const learnings: any[] = [];
            Object.values(mockStorage).forEach(agent => {
                if (agent.swarmId === swarmId) learnings.push(...agent.dataQuad.learning);
            });
            return learnings;
        }),
        loadSwarmAffects: jest.fn((swarmId) => {
            const affects: any[] = [];
            Object.values(mockStorage).forEach(agent => {
                if (agent.swarmId === swarmId) affects.push(...agent.dataQuad.affect);
            });
            return affects;
        }),
    };
});

describe('Cycle 10: Swarm Auto-Calibration (I-23)', () => {
    const swarmId = 'test-swarm-cycle-10';
    const agentAId = 'agent-a';
    const agentBId = 'agent-b';

    beforeEach(() => {
        const setupAgent = (id: string, memories: number = 0, affects: number = 0) => {
            const agent = {
                id,
                name: `Agent ${id}`,
                role: 'steward',
                status: 'active',
                swarmId,
                dataQuad: { context: [] as any[], affect: [] as any[], memory: [] as any[], learning: [] as any[] }
            };
            for (let i = 0; i < memories; i++) agent.dataQuad.memory.push({ timestamp: 't', content: 'm' });
            for (let i = 0; i < affects; i++) agent.dataQuad.affect.push({ timestamp: 't', content: 'Fracture detected' });
            return agent;
        };
        dbModule.saveAgentToDb(setupAgent(agentAId, 10, 0)); // Agent A: High resonance
        dbModule.saveAgentToDb(setupAgent(agentBId, 10, 0)); // Agent B: High resonance
    });

    test('I-23: Swarm pressure is correctly loaded for agents', async () => {
        // 1. Setup Agent A with fractures in a swarm
        dbModule.saveAgentToDb({
            id: agentAId,
            name: 'Agent A',
            role: 'steward',
            status: 'active',
            swarmId,
            dataQuad: { context: [], affect: [{ timestamp: 't', content: 'Fracture' }], memory: [], learning: [] }
        });

        // 2. Process prompt for Agent B (same swarm)
        // We verify that the processPrompt completes and correctly uses the swarm context.
        const result: any = await processPrompt('Stable observation.', agentBId);

        expect(result).toBeDefined();
        expect(result.observations).toContain('Prompt contains declarative structure');

        // Internal verification: Agent B should now have swarmAffects loaded (checked via mock call tracking)
        expect(dbModule.loadSwarmAffects).toHaveBeenCalledWith(swarmId);
    });
});
