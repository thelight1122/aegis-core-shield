import * as http from 'http';
import { GovernancePolicy } from './discernment-gate';

export interface Signal {
    type: 'memory' | 'fracture' | 'alert' | 'vaccine_candidate' | 'quarantine_start' | 'quarantine_end';
    payload: any;
    source: string; // agentId
    swarmId: string;
    timestamp: string;
    integrity?: number;
}

export interface StewardRegistryEntry {
    id: string;
    address: string;
    status: 'online' | 'offline';
    lastSeen: string;
    swarmId?: string;
    metrics?: {
        memories: number;
        affects: number;
    };
}

export class StewardPrime {
    private registry: Map<string, StewardRegistryEntry> = new Map();
    private resonanceStore: Map<string, number> = new Map(); // swarmId -> GRF
    private signals: Signal[] = []; // Recent significant events
    private activePolicy: GovernancePolicy = {
        version: 1,
        globalThresholdMultiplier: 1.0,
        blacklistedPatterns: []
    };
    private stabilityLog: { timestamp: string, avgGRF: number, multiplier: number }[] = [];
    private server: http.Server;
    private pollingInterval?: NodeJS.Timeout;

    constructor() {
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
    }

    public start(port: number = 8888) {
        this.server.listen(port, () => {
            console.log(`[AEGIS Prime] Listening on port ${port}`);
            // Start polling every 30s
            this.pollingInterval = setInterval(() => this.pollStewards(), 30000);
        });
    }

    private async pollStewards() {
        for (const [id, entry] of this.registry.entries()) {
            try {
                const status = await this.fetchStewardStatus(entry.address);
                entry.metrics = status.metrics;
                entry.status = 'online';
                entry.lastSeen = new Date().toISOString();
            } catch (e) {
                entry.status = 'offline';
            }
        }
        this.calculateGlobalResonance();
    }

    private fetchStewardStatus(address: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const req = http.get(`${address}/status`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.on('error', reject);
            req.end();
        });
    }

    private calculateGlobalResonance() {
        const swarms = new Map<string, { m: number, a: number }>();

        for (const entry of this.registry.values()) {
            if (entry.swarmId && entry.metrics) {
                const current = swarms.get(entry.swarmId) || { m: 0, a: 0 };
                current.m += entry.metrics.memories;
                current.a += entry.metrics.affects;
                swarms.set(entry.swarmId, current);
            }
        }

        for (const [swarmId, counts] of swarms.entries()) {
            const grf = counts.m + counts.a === 0 ? 1.0 : counts.m / (counts.m + counts.a);
            this.resonanceStore.set(swarmId, grf);
            console.log(`[AEGIS Prime] Global Resonance for ${swarmId}: ${grf.toFixed(2)}`);
        }

        // Trigger adaptive policy modulation
        this.updateGlobalPolicyThresholds();
    }

    private updateGlobalPolicyThresholds() {
        if (this.resonanceStore.size === 0) return;

        // Calculate average GRF across all swarms
        const resonances = Array.from(this.resonanceStore.values());
        const avgGRF = resonances.reduce((a, b) => a + b, 0) / resonances.length;

        // Adaptive logic:
        // High Resonance (1.0) -> Multiplier 1.0 (Standard)
        // Mid Resonance (0.7)  -> Multiplier 0.8 (Tighten slightly)
        // Low Resonance (0.4)  -> Multiplier 0.5 (Tighten significantly)
        // Formula: Multiplier = 0.5 + (avgGRF * 0.5) 
        // This keeps it between 0.5 (emergency) and 1.0 (equidistant)

        const newMultiplier = Math.max(0.5, Math.min(1.0, 0.5 + (avgGRF * 0.5)));

        const needsUpdate = Math.abs(this.activePolicy.globalThresholdMultiplier - newMultiplier) > 0.01;

        if (needsUpdate) {
            this.activePolicy = {
                ...this.activePolicy,
                globalThresholdMultiplier: Number(newMultiplier.toFixed(2)),
                version: this.activePolicy.version + 1
            };
            console.log(`[AEGIS Prime] Adaptive Equilibrium: Multiplier modulated to ${this.activePolicy.globalThresholdMultiplier} (Avg GRF: ${avgGRF.toFixed(2)})`);
        }

        // Log stability metrics
        this.stabilityLog.push({
            timestamp: new Date().toISOString(),
            avgGRF: Number(avgGRF.toFixed(3)),
            multiplier: this.activePolicy.globalThresholdMultiplier
        });

        // Keep last 100 logs
        if (this.stabilityLog.length > 100) this.stabilityLog.shift();
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = req.url || '';

        // 1. Registration endpoint
        if (req.method === 'POST' && url === '/register') {
            const body = await this.readBody(req);
            try {
                const entry = JSON.parse(body) as StewardRegistryEntry;
                entry.lastSeen = new Date().toISOString();
                entry.status = 'online';
                this.registry.set(entry.id, entry);

                console.log(`[AEGIS Prime] Registered steward: ${entry.id} (Swarm: ${entry.swarmId})`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'registered' }));
            } catch (e) {
                res.writeHead(400);
                res.end('Invalid Payload');
            }
            return;
        }

        // 2. Policy Distribution endpoint (for stewards)
        if (req.method === 'GET' && url === '/policy') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.activePolicy));
            return;
        }

        // 3. Policy Update endpoint (for admin/broadcast)
        if (req.method === 'POST' && url === '/broadcast') {
            const body = await this.readBody(req);
            try {
                const newPolicy = JSON.parse(body);
                this.activePolicy = {
                    ...newPolicy,
                    version: this.activePolicy.version + 1
                };
                console.log(`[AEGIS Prime] Broadcasted new policy version ${this.activePolicy.version}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'broadcasted', version: this.activePolicy.version }));
            } catch (e) {
                res.writeHead(400);
                res.end('Invalid Policy Payload');
            }
            return;
        }

        // 4. Signal Relay endpoint
        if (req.method === 'POST' && url === '/relay') {
            const body = await this.readBody(req);
            try {
                const signal = JSON.parse(body) as Signal;
                signal.timestamp = signal.timestamp || new Date().toISOString();
                this.signals.push(signal);

                // Keep only last 100 signals
                if (this.signals.length > 100) this.signals.shift();

                console.log(`[AEGIS Prime] Relayed ${signal.type} from ${signal.source} (Integrity: ${signal.integrity ?? 'N/A'})`);

                // Sequence 4, Cycle 3: Swarm Immune Synthesis
                if (signal.type === 'vaccine_candidate' && signal.payload && Array.isArray(signal.payload.patterns)) {
                    let updated = false;
                    for (const pattern of signal.payload.patterns) {
                        if (!this.activePolicy.blacklistedPatterns.includes(pattern)) {
                            this.activePolicy.blacklistedPatterns.push(pattern);
                            updated = true;
                        }
                    }
                    if (updated) {
                        this.activePolicy.version += 1;
                        console.log(`[AEGIS Prime] Synthesized Global Vaccine! Pattern added. New Policy v${this.activePolicy.version}.`);
                        // Actively broadcast to swarm
                        this.triggerPolicyBroadcast();
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'relayed' }));
            } catch (e) {
                res.writeHead(400);
                res.end('Invalid Signal Payload');
            }
            return;
        }

        // 5. Swarm Reflection endpoint (broadcast)
        if (req.method === 'POST' && url === '/reflect') {
            this.triggerSwarmReflection().then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ event: 'swarm_reflection_triggered', results }));
            }).catch(err => {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            });
            return;
        }

        // 6. Signals Fetch endpoint
        if (req.method === 'GET' && url === '/signals') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.signals));
            return;
        }

        // 8. Peers Fetch endpoint (for Decentralized Consensus)
        if (req.method === 'GET' && url === '/peers') {
            const peers = Array.from(this.registry.values()).map(p => ({
                id: p.id,
                address: p.address,
                swarmId: p.swarmId
            }));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(peers));
            return;
        }

        // 3. Health check / status endpoint
        if (req.method === 'GET' && url === '/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                prime: 'online',
                stewards: Array.from(this.registry.values()),
                globalResonances: Object.fromEntries(this.resonanceStore),
                recentSignalsCount: this.signals.length,
                policy: this.activePolicy
            }));
            return;
        }

        // 7. Collective Impact Assessment endpoint
        if (req.method === 'GET' && url === '/impact') {
            const report = this.getImpactReport();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(report));
            return;
        }

        // 9. Stability log endpoint
        if (req.method === 'GET' && url === '/stability') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ log: this.stabilityLog }));
            return;
        }

        res.writeHead(404);
        res.end();
    }

    private async triggerSwarmReflection(): Promise<any[]> {
        const results: any[] = [];
        for (const [id, steward] of this.registry.entries()) {
            try {
                const res = await new Promise((resolve, reject) => {
                    const req = http.request(`${steward.address}/reflect`, { method: 'POST' }, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    });
                    req.on('error', reject);
                    req.end();
                });
                results.push({ id, status: 'success', data: res });
            } catch (err: any) {
                results.push({ id, status: 'error', error: err.message });
            }
        }
        return results;
    }

    private async triggerPolicyBroadcast(): Promise<void> {
        const policyStr = JSON.stringify(this.activePolicy);
        for (const [id, steward] of this.registry.entries()) {
            const req = http.request(`${steward.address}/policy-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            req.on('error', (err) => {
                console.log(`[AEGIS Prime] Failed to push policy to ${id}: ${err.message}`);
            });
            req.write(policyStr);
            req.end();
        }
    }

    private getImpactReport() {
        const stats: Record<string, { memory: number, fracture: number, total: number }> = {};
        const virtues: Record<string, number> = {};

        for (const signal of this.signals) {
            const swarm = signal.swarmId || 'unknown';
            if (!stats[swarm]) stats[swarm] = { memory: 0, fracture: 0, total: 0 };

            stats[swarm].total++;
            if (signal.type === 'memory') stats[swarm].memory++;
            if (signal.type === 'fracture') {
                stats[swarm].fracture++;
                if (signal.payload && signal.payload.virtues) {
                    for (const v of signal.payload.virtues) {
                        virtues[v] = (virtues[v] || 0) + 1;
                    }
                }
            }
        }

        // Identify hotspots (virtues with multiple fractures)
        const hotspots = Object.entries(virtues)
            .filter(([_, count]) => count >= 3)
            .map(([virtue]) => virtue);

        return {
            timestamp: new Date().toISOString(),
            swarmStats: stats,
            topVirtueFractures: Object.entries(virtues)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            hotspots,
            recommendation: hotspots.length > 0
                ? `Systemic pressure detected on virtues: ${hotspots.join(', ')}. Consider global policy adjustment.`
                : 'Swarm equilibrium maintained.'
        };
    }

    private readBody(req: http.IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }

    public stop() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.server.close();
    }
}
