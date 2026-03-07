import { StewardPrime } from './steward-prime';
import { discernmentGate } from './discernment-gate';
import * as http from 'http';

describe('Sequence 2, Cycle 3: Broadcast Policies', () => {
    let prime: StewardPrime;
    const primePort = 8899;

    beforeAll(() => {
        prime = new StewardPrime();
        prime.start(primePort);
    });

    afterAll(() => {
        prime.stop();
    });

    test('Prime distributes policy and versions it', async () => {
        // 1. Initial policy
        const initialPolicy = await fetchJSON(`http://localhost:${primePort}/policy`);
        expect(initialPolicy.version).toBe(1);
        expect(initialPolicy.globalThresholdMultiplier).toBe(1.0);

        // 2. Broadcast new policy
        const update = JSON.stringify({
            globalThresholdMultiplier: 0.5,
            blacklistedPatterns: ['toxic', 'chaos']
        });
        const broadcastRes = await postJSON(`http://localhost:${primePort}/broadcast`, update);
        expect(broadcastRes.status).toBe('broadcasted');
        expect(broadcastRes.version).toBe(2);

        // 3. Verify distributor update
        const updatedPolicy = await fetchJSON(`http://localhost:${primePort}/policy`);
        expect(updatedPolicy.version).toBe(2);
        expect(updatedPolicy.globalThresholdMultiplier).toBe(0.5);
    });

    test('DiscernmentGate respects GovernancePolicy multipliers', () => {
        const units = [{ text: 'test', tokens: [], start: 0, end: 4, startIndex: 0, endIndex: 4, isCompound: false }];
        const rawScores = { Honesty: 0.95, Respect: 1.0, Attention: 1.0, Affection: 1.0, Loyalty: 1.0, Trust: 1.0, Communication: 1.0 };

        const policy1 = { version: 1, globalThresholdMultiplier: 1.0, blacklistedPatterns: [] };
        const res1 = discernmentGate('test prompt', units, rawScores, 0, 1.0, policy1);
        expect(res1.path).toBe('admitted');

        const policy2 = { version: 2, globalThresholdMultiplier: 0.4, blacklistedPatterns: [] };
        const res2 = discernmentGate('test prompt', units, rawScores, 0, 1.0, policy2);
        expect(res2.path).toBe('shallow-return');
    });

    test('DiscernmentGate respects GovernancePolicy blacklists', () => {
        const units = [{ text: 'chaos', tokens: [], start: 0, end: 5, startIndex: 0, endIndex: 5, isCompound: false }];
        const rawScores = { Honesty: 1.0, Respect: 1.0, Attention: 1.0, Affection: 1.0, Loyalty: 1.0, Trust: 1.0, Communication: 1.0 };
        const policy = { version: 1, globalThresholdMultiplier: 1.0, blacklistedPatterns: ['chaotic'] };

        const res = discernmentGate('A chaotic request', units, rawScores, 0, 1.0, policy);
        expect(res.path).toBe('deep-return');
        expect(res.fractureVirtues[0].minUnit).toBe('Policy Exclusion');
    });

    async function fetchJSON(url: string) {
        return new Promise<any>((resolve) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
        });
    }

    async function postJSON(url: string, body: string) {
        return new Promise<any>((resolve) => {
            const req = http.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.write(body);
            req.end();
        });
    }
});
