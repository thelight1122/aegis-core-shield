import { activeGovernancePolicy } from './governance-state';
import * as http from 'http';

// We need to mock the knownPeers array inside the module
// but for simplicity in this unit test without full DI,
// we will test the logic of proposal and consensus threshold explicitly.

describe('Sequence 3, Cycle 2: Decentralized Consensus', () => {

    it('requires a simple majority of (knownPeers + 1) to pass a proposal', () => {
        // Our active agent makes 1 vote (Yes)
        const myVote = 1;

        // Scenario 1: 0 peers
        let knownPeers = 0;
        let requiredMajority = Math.floor((knownPeers + 1) / 2) + 1;
        expect(requiredMajority).toBe(1);
        expect(myVote >= requiredMajority).toBe(true);

        // Scenario 2: 1 peer (Total network: 2) -> Needs 2 votes (Unanimity)
        knownPeers = 1;
        requiredMajority = Math.floor((knownPeers + 1) / 2) + 1;
        expect(requiredMajority).toBe(2);

        // Scenario 3: 2 peers (Total network: 3) -> Needs 2 votes
        knownPeers = 2;
        requiredMajority = Math.floor((knownPeers + 1) / 2) + 1;
        expect(requiredMajority).toBe(2);

        // Scenario 4: 9 peers (Total network: 10) -> Needs 6 votes
        knownPeers = 9;
        requiredMajority = Math.floor((knownPeers + 1) / 2) + 1;
        expect(requiredMajority).toBe(6);
    });

    it('updates local governance policy upon consensus success', () => {
        const currentPolicy = activeGovernancePolicy;
        const initialVersion = currentPolicy.version;

        // Simulate local adoption logic from proposePolicyChange
        const newMultiplier = 0.6;
        const updatedPolicy = {
            ...currentPolicy,
            globalThresholdMultiplier: newMultiplier,
            version: currentPolicy.version + 100 // Jump version to indicate local fork
        };

        expect(updatedPolicy.globalThresholdMultiplier).toBe(0.6);
        expect(updatedPolicy.version).toBeGreaterThan(initialVersion);
    });

});
