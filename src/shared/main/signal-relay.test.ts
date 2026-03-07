import { StewardPrime } from './steward-prime';
import * as http from 'http';

describe('Sequence 2, Cycle 4: Swarm Signal Relay', () => {
    let prime: StewardPrime;
    const primePort = 8901;

    beforeAll(() => {
        prime = new StewardPrime();
        prime.start(primePort);
    });

    afterAll(() => {
        prime.stop();
    });

    test('Prime receives and stores relayed signals', async () => {
        const signal = JSON.stringify({
            type: 'memory',
            payload: { prompt: 'High integrity prompt', score: 0.98 },
            source: 'test-agent-1',
            swarmId: 'swarm-alpha',
            integrity: 0.98
        });

        // 1. Send signal to /relay
        const relayRes = await postJSON(`http://localhost:${primePort}/relay`, signal);
        expect(relayRes.status).toBe('relayed');

        // 2. Verify signal count in /status
        const statusRes = await fetchJSON(`http://localhost:${primePort}/status`);
        expect(statusRes.recentSignalsCount).toBe(1);

        // 3. Fetch full signal list
        const signals = await fetchJSON(`http://localhost:${primePort}/signals`);
        expect(signals.length).toBe(1);
        expect(signals[0].type).toBe('memory');
        expect(signals[0].source).toBe('test-agent-1');
        expect(signals[0].payload.score).toBe(0.98);
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
