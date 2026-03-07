import { processPrompt } from './ids-processor';
import * as dbModule from './db/database';

jest.mock('./db/database', () => {
    const mockStorage: Record<string, any> = {};
    return {
        isDatabaseInitialized: jest.fn(() => true),
        loadAgentFromDb: jest.fn((id) => mockStorage[id] || null),
        saveAgentToDb: jest.fn((agent) => { mockStorage[agent.id] = agent; }),
        loadSwarmMemories: jest.fn((swarmId) => {
            // Find all agents in this swarm and return their memories
            const memories: any[] = [];
            Object.values(mockStorage).forEach(agent => {
                if (agent.swarmId === swarmId) {
                    memories.push(...agent.dataQuad.memory);
                }
            });
            return memories.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        }),
        loadSwarmLearnings: jest.fn((swarmId) => {
            // Find all agents in this swarm and return their learnings
            const learnings: any[] = [];
            Object.values(mockStorage).forEach(agent => {
                if (agent.swarmId === swarmId) {
                    learnings.push(...agent.dataQuad.learning);
                }
            });
            return learnings.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        }),
        loadSwarmAffects: jest.fn(() => []),
    };
});

describe('Cycle 9: Collective Distillation (I-21/I-22)', () => {
    const swarmId = 'test-swarm-cycle-9';
    const agentAId = 'agent-a';
    const agentBId = 'agent-b';

    beforeEach(() => {
        // Setup initial agents in the same swarm
        const setupAgent = (id: string) => ({
            id,
            name: `Agent ${id}`,
            role: 'steward',
            status: 'active',
            swarmId,
            dataQuad: { context: [], affect: [], memory: [], learning: [] }
        });
        dbModule.saveAgentToDb(setupAgent(agentAId));
        dbModule.saveAgentToDb(setupAgent(agentBId));
    });

    test('I-21/I-22: Agent B observes Collective Wisdom from Agent A distillation', async () => {
        // 1. Manually inject a "Temporal Distillation" learning entry into Agent A
        const agentA = dbModule.loadAgentFromDb(agentAId);
        agentA.dataQuad.learning.push({
            timestamp: new Date().toISOString(),
            content: 'Temporal Distillation: Consolidated historical resonance into a structural summary.'
        });
        dbModule.saveAgentToDb(agentA);

        // 2. Process a prompt for Agent B
        const result: any = await processPrompt('Collective test.', agentBId);

        // 3. Verify that Agent B reflects Agent A's learning as "Collective Wisdom"
        expect(result.observations.some((obs: string) => obs.includes('Collective Wisdom: Swarm resonance summary observed'))).toBe(true);
        expect(result.output.includes('Collective Wisdom: Distilled structural insight integrated')).toBe(true);
    });
});
