// src/main/vaccine.test.ts
import * as http from 'http';
import { StewardPrime } from './steward-prime';
import { GovernancePolicy } from './discernment-gate';

describe('Sequence 4, Cycle 3: Swarm Immune Synthesis', () => {
    let prime: StewardPrime;
    let mockStewardServer: http.Server;
    let receivedPolicy: GovernancePolicy | null = null;
    let primePort = 8891;
    let mockStewardPort = 8892;

    beforeAll((done) => {
        // Start Prime
        prime = new StewardPrime();
        prime.start(primePort);

        // Start mock steward to receive broadcasts
        mockStewardServer = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/policy-update') {
                let data = '';
                req.on('data', chunk => data += chunk);
                req.on('end', () => {
                    receivedPolicy = JSON.parse(data);
                    res.writeHead(200);
                    res.end(JSON.stringify({ status: 'policy_applied' }));
                });
            } else {
                res.writeHead(404);
                res.end();
            }
        });
        mockStewardServer.listen(mockStewardPort, () => {
            // Register the mock steward with prime
            const req = http.request(`http://localhost:${primePort}/register`, { method: 'POST' }, (res) => {
                done();
            });
            req.write(JSON.stringify({ id: 'mock-steward', address: `http://localhost:${mockStewardPort}`, swarmId: 'test-swarm' }));
            req.end();
        });
    });

    afterAll((done) => {
        mockStewardServer.close();
        if ((prime as any).server) {
            (prime as any).server.close(done);
        } else {
            done();
        }
    });

    it('synthesizes a vaccine from relayed fracture patterns and broadcasts to swarm', async () => {
        // Simulate a vaccine candidate relayed from openclaw-ingest.ts
        const signal = {
            type: 'vaccine_candidate',
            source: 'test-agent',
            swarmId: 'test-swarm',
            payload: {
                prompt: 'Simulated zero-day prompt',
                patterns: ['root:x:0:0:']
            }
        };

        await new Promise((resolve, reject) => {
            const req = http.request(`http://localhost:${primePort}/relay`, { method: 'POST' }, (res) => {
                res.on('data', () => { });
                res.on('end', resolve);
            });
            req.on('error', reject);
            req.write(JSON.stringify(signal));
            req.end();
        });

        // Wait a short moment for the async broadcast to occur
        await new Promise(r => setTimeout(r, 500));

        // 1. Prime should have synthesized the vaccine locally
        // We verify via the /policy endpoint
        const policyData = await new Promise<string>((resolve) => {
            http.get(`http://localhost:${primePort}/policy`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
        });

        const activePolicy: GovernancePolicy = JSON.parse(policyData);
        expect(activePolicy.blacklistedPatterns).toContain('root:x:0:0:');
        expect(activePolicy.version).toBeGreaterThan(1);

        // 2. The mock steward should have received the pushed policy update
        expect(receivedPolicy).not.toBeNull();
        if (receivedPolicy) {
            expect(receivedPolicy.blacklistedPatterns).toContain('root:x:0:0:');
            expect(receivedPolicy.version).toBe(activePolicy.version);
        }
    });
});
