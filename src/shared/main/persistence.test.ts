import { processPrompt } from './ids-processor';
import * as dbModule from './db/database';

// Mock the database module
jest.mock('./db/database', () => {
    const mockDb: Record<string, any> = {};
    return {
        initDatabase: jest.fn(),
        getDb: jest.fn(),
        isDatabaseInitialized: jest.fn(() => true),
        saveAgentToDb: jest.fn((agent: any) => {
            mockDb[agent.id] = JSON.parse(JSON.stringify(agent)); // deep copy
        }),
        loadAgentFromDb: jest.fn((agentId: string) => {
            return mockDb[agentId] ? JSON.parse(JSON.stringify(mockDb[agentId])) : null;
        }),
        getSystemMetrics: jest.fn(() => ({ totalAgents: 0, totalEntries: 0 }))
    };
});

describe('Cycle 4: Persistence & Topology (I-11/I-12)', () => {
    const agentId = 'test-agent-' + Date.now();

    beforeAll(() => {
        // No real FS needs for mock
    });

    afterAll(() => {
        // No real FS cleanup for mock
    });

    test('I-11: State accumulates over multiple prompts', async () => {
        // Prompt 1: Admitted
        await processPrompt('The data signal is stable and observations are clear.', agentId);

        // Prompt 2: Fracture
        await processPrompt('You must believe that the signal is stable!', agentId);

        const savedAgent = (dbModule.loadAgentFromDb as jest.Mock)(agentId);

        // Should have 1 memory (admitted) and 1 affect (fracture)
        const memoryCount = savedAgent.dataQuad.memory.length;
        const affectCount = savedAgent.dataQuad.affect.length;

        expect(memoryCount).toBe(1);
        expect(affectCount).toBe(1);
    });

    test('I-12: Memory topology index is generated and stored', async () => {
        const prompt = 'Observation of a stable pattern in the field.';
        const customAgentId = 'topology-agent-' + Date.now();
        await processPrompt(prompt, customAgentId);

        const savedAgent = (dbModule.loadAgentFromDb as jest.Mock)(customAgentId);
        const memoryEntries = savedAgent.dataQuad.memory;

        const lastEntry = memoryEntries[memoryEntries.length - 1];
        expect(lastEntry.topologyIndex).toBeDefined();
        expect(lastEntry.topologyIndex.length).toBe(12);
        expect(lastEntry.content).toBe(prompt);
    });
});
