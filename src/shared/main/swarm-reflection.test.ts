import { StewardPrime } from './steward-prime';
import * as http from 'http';

describe('Sequence 2, Cycle 5: Swarm-Wide Reflection', () => {
    let prime: StewardPrime;
    const primePort = 8911;
    let mockSteward: http.Server;
    const stewardPort = 8912;
    let reflectionReceived = false;

    beforeAll(async () => {
        prime = new StewardPrime();
        prime.start(primePort);

        mockSteward = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/reflect') {
                reflectionReceived = true;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'reflecting' }));
                return;
            }
            res.writeHead(404).end();
        });

        await new Promise<void>(resolve => mockSteward.listen(stewardPort, resolve));

        // Register the mock steward
        await new Promise((resolve) => {
            const req = http.request(`http://localhost:${primePort}/register`, {
                method: 'POST'
            }, (res) => {
                res.on('data', () => { });
                res.on('end', resolve);
            });
            req.write(JSON.stringify({
                id: 'mock-steward-1',
                address: `http://localhost:${stewardPort}`,
                swarmId: 'test-swarm'
            }));
            req.end();
        });
    });

    afterAll(async () => {
        prime.stop();
        await new Promise(resolve => mockSteward.close(resolve));
    });

    it('should trigger reflection on registered stewards via Prime /reflect', async () => {
        const response: any = await new Promise((resolve) => {
            const req = http.request(`http://localhost:${primePort}/reflect`, {
                method: 'POST'
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.end();
        });

        expect(response.event).toBe('swarm_reflection_triggered');
        expect(response.results[0].status).toBe('success');
        expect(reflectionReceived).toBe(true);
    });
});
