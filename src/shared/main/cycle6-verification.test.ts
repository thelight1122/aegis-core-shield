import { processPrompt } from './ids-processor';
import * as dbModule from './db/database';

jest.mock('./db/database', () => {
    const agents: Record<string, any> = {};
    const memories: Record<string, any[]> = {};

    return {
        isDatabaseInitialized: jest.fn(() => true),
        loadAgentFromDb: jest.fn((id) => agents[id] || null),
        saveAgentToDb: jest.fn((agent) => {
            agents[agent.id] = agent;
            if (agent.swarmId) {
                memories[agent.swarmId] = (memories[agent.swarmId] || []).concat(agent.dataQuad.memory);
                (agents as any)[`learnings_${agent.swarmId}`] = ((agents as any)[`learnings_${agent.swarmId}`] || []).concat(agent.dataQuad.learning);
            }
        }),
        loadSwarmMemories: jest.fn((swarmId) => memories[swarmId] || []),
        loadSwarmLearnings: jest.fn((swarmId) => (agents as any)[`learnings_${swarmId}`] || []),
        loadSwarmAffects: jest.fn(() => []),
    };
});

describe('Cycle 6: Swarm Synchronization (I-15)', () => {
    test('Cross-Agent Mirroring: Agent B mirrors Agent A in same Swarm', async () => {
        const swarmId = 'swarm-resonance-alpha';
        const agentAId = 'agent-a';
        const agentBId = 'agent-b';

        // 1. Manually setup Agent A in swarm
        const agentA = {
            id: agentAId,
            name: 'Agent A',
            role: 'steward',
            status: 'active',
            swarmId: swarmId,
            dataQuad: { context: [], affect: [], memory: [], learning: [] }
        };
        dbModule.saveAgentToDb(agentA);

        // 2. Process prompt for Agent A to generate topology in swarm memory
        await processPrompt('Structural foundation established.', agentAId);

        // 3. Setup Agent B in same swarm
        const agentB = {
            id: agentBId,
            name: 'Agent B',
            role: 'steward',
            status: 'active',
            swarmId: swarmId,
            dataQuad: { context: [], affect: [], memory: [], learning: [] }
        };
        dbModule.saveAgentToDb(agentB);

        // 4. Process prompt for Agent B
        const result: any = await processPrompt('Secondary observation.', agentBId);

        // 5. Verify Mirroring reflects swarm topology
        expect(result.observations.some((obs: string) => obs.includes('Mirror: Observed resonance with swarm topology'))).toBe(true);
    });
});
