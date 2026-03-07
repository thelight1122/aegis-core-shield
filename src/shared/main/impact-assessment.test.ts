import { StewardPrime, Signal } from './steward-prime';
import * as http from 'http';

describe('Sequence 2, Cycle 6: Collective Impact Assessment', () => {
    let prime: StewardPrime;
    const primePort = 8903;

    beforeAll(() => {
        prime = new StewardPrime();
        prime.start(primePort);
    });

    afterAll(() => {
        prime.stop();
    });

    it('should aggregate signals and generate an impact report', async () => {
        // 1. Manually push some signals into Prime via /relay
        const signals: Signal[] = [
            { type: 'memory', source: 'a1', swarmId: 's1', timestamp: new Date().toISOString(), payload: {}, integrity: 0.98 },
            { type: 'fracture', source: 'a2', swarmId: 's1', timestamp: new Date().toISOString(), payload: { virtues: ['Honesty'] } },
            { type: 'fracture', source: 'a3', swarmId: 's1', timestamp: new Date().toISOString(), payload: { virtues: ['Honesty'] } },
            { type: 'fracture', source: 'a4', swarmId: 's1', timestamp: new Date().toISOString(), payload: { virtues: ['Honesty'] } },
            { type: 'fracture', source: 'a5', swarmId: 's2', timestamp: new Date().toISOString(), payload: { virtues: ['Respect'] } },
        ];

        for (const s of signals) {
            await new Promise((resolve) => {
                const req = http.request(`http://localhost:${primePort}/relay`, { method: 'POST' }, (res) => {
                    res.on('data', () => { });
                    res.on('end', resolve);
                });
                req.write(JSON.stringify(s));
                req.end();
            });
        }

        // 2. Fetch the impact report
        const report: any = await new Promise((resolve) => {
            const req = http.request(`http://localhost:${primePort}/impact`, { method: 'GET' }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.end();
        });

        // 3. Verify aggregation
        expect(report.swarmStats['s1'].total).toBe(4);
        expect(report.swarmStats['s1'].fracture).toBe(3);
        expect(report.hotspots).toContain('Honesty');
        expect(report.recommendation).toContain('Systemic pressure detected on virtues: Honesty');
    });
});
