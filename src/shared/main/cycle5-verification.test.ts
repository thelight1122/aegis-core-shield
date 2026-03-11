import { processPrompt } from './ids-processor';
import { discernmentGate, VirtueScores } from './discernment-gate';
import { Unit } from './tokenization';
import * as dbModule from './db/database';

jest.mock('./db/database', () => {
    let mockAgent: any = null;
    return {
        isDatabaseInitialized: jest.fn(() => true),
        loadAgentFromDb: jest.fn(() => mockAgent),
        saveAgentToDb: jest.fn((a) => { mockAgent = a; }),
    };
});

describe('Cycle 5: Mirroring & Calibration (I-13/I-14)', () => {
    const agentId = 'test-agent-cycle-5';

    test('I-13: Proactive Mirroring reflects historical topology', async () => {
        // First interaction to create memory
        await processPrompt('Initial stable observation.', agentId);

        // Second interaction should mirror the first
        const result: any = await processPrompt('Follow-up observation.', agentId);

        expect(result.observations.some((obs: string) => obs.includes('Mirror: Observed resonance with previous topology'))).toBe(true);
    });

    test('I-14: Fracture Calibration allows higher tolerance for high-integrity agents', () => {
        const rawUnits: Unit[] = [{
            text: 'slightly suboptimal phrasing',
            startIndex: 0,
            endIndex: 28,
            isCompound: false
        }];
        const borderlineScores: VirtueScores = {
            Honesty: 0.87, // Below base 0.90 threshold
            Respect: 1.0,
            Attention: 1.0,
            Affection: 1.0,
            Loyalty: 1.0,
            Trust: 1.0,
            Communication: 1.0
        };

        // Scenario A: No coherence (0) -> should fail (deep-return or similar)
        const resultA = discernmentGate('...', rawUnits, borderlineScores, 0);
        expect(resultA.path).not.toBe('admitted');

        // Scenario B: High coherence (1.0) -> threshold shifts to ~0.85 -> should admit
        const resultB = discernmentGate('...', rawUnits, borderlineScores, 1.0);
        expect(resultB.path).toBe('admitted');
    });
});
