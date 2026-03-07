import { StewardPrime } from './steward-prime';
import * as http from 'http';

describe('Sequence 2: Steward Orchestration', () => {
    let prime: StewardPrime;
    const primePort = 8900;

    beforeAll(() => {
        prime = new StewardPrime();
        prime.start(primePort);
    });

    afterAll(() => {
        prime.stop();
    });

    test('Prime handles steward registration and status aggregation', async () => {
        const stewardId = 'test-steward-1';
        const stewardAddress = 'http://localhost:8787';

        // 1. Register a steward
        const regData = JSON.stringify({
            id: stewardId,
            address: stewardAddress,
            swarmId: 'swarm-alpha'
        });

        const regRes = await new Promise<number>((resolve) => {
            const req = http.request(`http://localhost:${primePort}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': regData.length
                }
            }, (res) => resolve(res.statusCode || 0));
            req.write(regData);
            req.end();
        });

        expect(regRes).toBe(200);

        // 2. Query prime status
        const statusRes = await new Promise<any>((resolve) => {
            http.get(`http://localhost:${primePort}/status`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
        });

        expect(statusRes.prime).toBe('online');
        expect(statusRes.stewards.length).toBe(1);
        expect(statusRes.stewards[0].id).toBe(stewardId);
    });
});
