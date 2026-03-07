import { StewardPrime } from './steward-prime';
import * as http from 'http';

describe('Sequence 2, Cycle 2: Global Pressure Aggregation', () => {
    let prime: StewardPrime;
    const primePort = 8898;
    let mockSteward1: http.Server;
    let mockSteward2: http.Server;
    const steward1Port = 8788;
    const steward2Port = 8789;

    beforeAll(async () => {
        prime = new StewardPrime();
        prime.start(primePort);

        // Mock Steward 1: Healthy (10 memories, 0 affects)
        mockSteward1 = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'online',
                metrics: { memories: 10, affects: 0 }
            }));
        }).listen(steward1Port);

        // Mock Steward 2: Pressure (5 memories, 5 affects)
        mockSteward2 = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'online',
                metrics: { memories: 5, affects: 5 }
            }));
        }).listen(steward2Port);
    });

    afterAll(() => {
        prime.stop();
        mockSteward1.close();
        mockSteward2.close();
    });

    test('Prime aggregates resonance from multiple stewards', async () => {
        // 1. Register both stewards to the same swarm
        const register = (id: string, port: number) => {
            const data = JSON.stringify({
                id,
                address: `http://localhost:${port}`,
                swarmId: 'swarm-alpha'
            });
            return new Promise<void>((resolve) => {
                const req = http.request(`http://localhost:${primePort}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
                }, () => resolve());
                req.write(data);
                req.end();
            });
        };

        await register('steward-1', steward1Port);
        await register('steward-2', steward2Port);

        // 2. Query prime status
        const initialStatus = await fetchJSON(`http://localhost:${primePort}/status`);
        expect(initialStatus.stewards.length).toBe(2);

        // Manually trigger poll
        await (prime as any).pollStewards();

        // 3. Verify Global Resonance
        const status = await fetchJSON(`http://localhost:${primePort}/status`);
        expect(status.globalResonances['swarm-alpha']).toBe(0.75);
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
});
