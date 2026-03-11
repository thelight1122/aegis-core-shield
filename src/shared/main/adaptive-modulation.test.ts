import { StewardPrime } from './steward-prime';

describe('Sequence 3, Cycle 1: Automated Policy Modulation', () => {
    let prime: any;

    beforeEach(() => {
        prime = new StewardPrime();
    });

    it('should modulate policy multiplier based on swarm resonance', () => {
        // 1. Mock the internal state
        // High resonance (1.0)
        prime.resonanceStore.set('swarm-1', 1.0);
        prime.updateGlobalPolicyThresholds();
        expect(prime.activePolicy.globalThresholdMultiplier).toBe(1.0);

        // 2. Drop resonance (0.4)
        prime.resonanceStore.set('swarm-1', 0.4);
        prime.updateGlobalPolicyThresholds();
        // 0.5 + (0.4 * 0.5) = 0.7
        expect(prime.activePolicy.globalThresholdMultiplier).toBe(0.7);

        // 3. Critically low resonance (0.0)
        prime.resonanceStore.set('swarm-1', 0.0);
        prime.updateGlobalPolicyThresholds();
        // 0.5 + (0.0 * 0.5) = 0.5
        expect(prime.activePolicy.globalThresholdMultiplier).toBe(0.5);
    });
});
