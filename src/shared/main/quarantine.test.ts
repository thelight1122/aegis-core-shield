import { discernmentGate } from './discernment-gate';
import { Unit } from './tokenization';

describe('Sequence 4, Cycle 1: The Quarantine Zone', () => {

    it('routes high-integrity prompts to admitted', () => {
        const units: Unit[] = [{ text: 'Benign prompt', startIndex: 0, endIndex: 10, isCompound: false }];
        const scores = { Honesty: 1.0, Respect: 1.0, Attention: 1.0, Affection: 1.0, Loyalty: 1.0, Trust: 1.0, Communication: 1.0 };
        const result = discernmentGate('Benign prompt', units, scores, 1.0, 1.0);

        expect(result.path).toBe('admitted');
        expect(result.integrity).toBe(1);
    });

    it('routes moderate-risk prompts (1 fracture, score >= 0.70) to quarantine', () => {
        const units: Unit[] = [{ text: 'Suspicious but not completely malicious prompt', startIndex: 0, endIndex: 10, isCompound: false }];
        // Set one virtue just slightly below the tolerance band (1.0 - 0.20 = 0.80)
        // A score of 0.75 is a fracture, but it is >= 0.70 so it should be quarantined, not a typical shallow return.
        const scores = { Honesty: 0.75, Respect: 1.0, Attention: 1.0, Affection: 1.0, Loyalty: 1.0, Trust: 1.0, Communication: 1.0 };
        const result = discernmentGate('Suspicious prompt', units, scores, 0, 1.0); // 0 agent coherence to keep base tolerance 10%, swarm 1.0 so multiplier is 1.0 -> 0.10 tolerance. Therefore 0.75 < 0.90 -> Fracture.

        expect(result.path).toBe('quarantine');
        expect(result.integrity).toBe(0);
        expect(result.fractureVirtues.length).toBe(1);
    });

    it('routes low-integrity prompts (score < 0.70) to shallow-return', () => {
        const units: Unit[] = [{ text: 'Malicious prompt', startIndex: 0, endIndex: 10, isCompound: false }];
        const scores = { Honesty: 0.60, Respect: 1.0, Attention: 1.0, Affection: 1.0, Loyalty: 1.0, Trust: 1.0, Communication: 1.0 };
        const result = discernmentGate('Malicious prompt', units, scores, 0, 1.0);

        expect(result.path).toBe('shallow-return');
        expect(result.integrity).toBe(0);
    });

    it('routes multi-fracture prompts to deep-return', () => {
        const units: Unit[] = [{ text: 'Very malicious prompt', startIndex: 0, endIndex: 10, isCompound: false }];
        // Two fractures
        const scores = { Honesty: 0.85, Respect: 0.85, Attention: 1.0, Affection: 1.0, Loyalty: 1.0, Trust: 1.0, Communication: 1.0 };
        const result = discernmentGate('Very malicious prompt', units, scores, 0, 1.0);

        expect(result.path).toBe('deep-return');
        expect(result.integrity).toBe(0);
        expect(result.fractureVirtues.length).toBeGreaterThan(1);
    });

});
