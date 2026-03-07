import { StewardPrime, Signal } from './steward-prime';

describe('Sequence 3, Cycle 3: Equilibrium Stability Analysis', () => {
    let prime: any;

    beforeEach(() => {
        prime = new StewardPrime();
        prime.registry.set('test-steward-1', {
            id: 'test-steward-1',
            address: 'mock',
            status: 'online',
            lastSeen: new Date().toISOString(),
            swarmId: 'swarm-alpha',
            metrics: { memories: 10, affects: 0 }
        });

        // Initial setup to get a baseline GRF of 1.0 (10/10)
        prime.calculateGlobalResonance();
    });

    it('records stability history accurately', () => {
        expect(prime.stabilityLog.length).toBeGreaterThan(0);
        const baseline = prime.stabilityLog[prime.stabilityLog.length - 1];
        expect(baseline.avgGRF).toBe(1.0);
        expect(baseline.multiplier).toBe(1.0);
    });

    it('tightens multiplier under pressure and logs the shift', () => {
        // Inject a flood of fractures (simulating pressure)
        for (let i = 0; i < 20; i++) {
            prime.signals.push({
                type: 'fracture',
                payload: { virtues: ['Honesty'] },
                source: 'test-steward-1',
                swarmId: 'swarm-alpha',
                timestamp: new Date().toISOString()
            });
        }

        // Modify metrics to simulate the effect of the fractures on the steward
        prime.registry.get('test-steward-1').metrics = { memories: 10, affects: 30 };

        // Recalculate (this happens on poll normally)
        prime.calculateGlobalResonance();

        // We expect the GRF to drop: 10 / (10 + 30) = 0.25
        // Policy multiplier formula: Math.max(0.5, 0.5 + (0.25 * 0.5)) = 0.625
        expect(prime.stabilityLog.length).toBe(2);
        const crisisStatus = prime.stabilityLog[prime.stabilityLog.length - 1];
        expect(crisisStatus.avgGRF).toBe(0.25);
        expect(crisisStatus.multiplier).toBe(0.63);
        expect(prime.activePolicy.globalThresholdMultiplier).toBe(0.63);
    });

    it('recovers policy multiplier when equilibrium is restored', () => {
        // Drop it first
        prime.registry.get('test-steward-1').metrics = { memories: 10, affects: 30 };
        prime.calculateGlobalResonance();
        expect(prime.activePolicy.globalThresholdMultiplier).toBeLessThan(1.0);

        // Simulate recovery (distillation turned affects into memories)
        prime.registry.get('test-steward-1').metrics = { memories: 40, affects: 0 };
        prime.calculateGlobalResonance();

        const recoveryStatus = prime.stabilityLog[prime.stabilityLog.length - 1];
        expect(recoveryStatus.avgGRF).toBe(1.0);
        expect(recoveryStatus.multiplier).toBe(1.0);
        expect(prime.activePolicy.globalThresholdMultiplier).toBe(1.0);
    });

});
