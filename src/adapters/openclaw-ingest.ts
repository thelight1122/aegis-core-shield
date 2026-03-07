import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

import { OpenClawEvent, OpenClawLogEntry, OpenClawAdapterOptions, processOpenClawEvent } from './openclaw-adapter';
import { initDatabase, saveAgentToDb, loadSwarmMemories, loadSwarmAffects, loadAgentFromDb } from '../shared/main/db/database';
import { runAutoDistillation } from '../shared/main/auto-distill';
import { GovernancePolicy } from '../shared/main/discernment-gate';
import { activeGovernancePolicy, updateActivePolicy } from '../shared/main/governance-state';
import { runInSandbox } from '../shared/main/sandbox-runner';
import { analyzeExecutionOutput } from '../shared/main/crucible';

let knownPeers: { id: string, address: string, swarmId?: string }[] = [];

const ADAPTER_LOG_DIR = process.env.AEGIS_ADAPTER_LOG_DIR || path.join(process.cwd(), 'data', 'adapter-logs');
const OPENCLAW_LOG_FILE = path.join(ADAPTER_LOG_DIR, 'openclaw-events.jsonl');

export interface IngestServerOptions extends OpenClawAdapterOptions {
  port?: number;
  host?: string;
  authToken?: string;
}

export const initOpenClawLogger = (): void => {
  if (!fs.existsSync(ADAPTER_LOG_DIR)) {
    fs.mkdirSync(ADAPTER_LOG_DIR, { recursive: true });
  }

  if (!fs.existsSync(OPENCLAW_LOG_FILE)) {
    fs.writeFileSync(OPENCLAW_LOG_FILE, '', 'utf8');
  }
};

export const appendOpenClawLogEntry = (entry: OpenClawLogEntry): void => {
  initOpenClawLogger();
  fs.appendFileSync(OPENCLAW_LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
};

export const ingestOpenClawEvent = async (
  event: OpenClawEvent,
  options: OpenClawAdapterOptions = {}
): Promise<OpenClawLogEntry> => {
  const entry = await processOpenClawEvent(event, options);
  appendOpenClawLogEntry(entry);
  return entry;
};

const readBody = (req: http.IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

// ─────────────────────────────────────────────────────────
// Sequence 6, Cycle 1: CORS helper for remote VM access
// ─────────────────────────────────────────────────────────
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.AEGIS_CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-AEGIS-Agent-ID'
};

const addCorsHeaders = (res: http.ServerResponse): void => {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
};

// ─────────────────────────────────────────────────────────
// Sequence 6: Server-Sent Events (SSE) live event push
// Eliminates polling lag — UI subscribes once and receives
// real-time events as OpenClaw Actions are processed.
// ─────────────────────────────────────────────────────────
const sseClients = new Set<http.ServerResponse>();

const broadcastSSE = (eventType: string, data: unknown): void => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
};

export const createStewardServer = (options: IngestServerOptions = {}): http.Server => {
  const hashPrompt = options.hashPrompt;

  const server = http.createServer(async (req, res) => {
    // Inject CORS headers on every response to allow VM/remote clients
    addCorsHeaders(res);

    // Handle OPTIONS preflight for browser-based or proxied VM clients
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', agentId: process.env.AEGIS_AGENT_ID || 'default-agent', timestamp: new Date().toISOString() }));
      return;
    }

    // ── SSE Live Event Stream ──────────────────────────────────────
    if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        'x-accel-buffering': 'no'
      });
      res.write(':aegis-sse-connected\n\n'); // initial handshake comment

      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (req.method === 'GET' && req.url === '/status') {
      const agentId = process.env.AEGIS_AGENT_ID || 'default-agent';
      const swarmId = process.env.AEGIS_SWARM_ID;

      let metrics = { memories: 0, affects: 0 };
      if (swarmId) {
        try {
          const memories = loadSwarmMemories(swarmId);
          const affects = loadSwarmAffects(swarmId);
          metrics = { memories: memories.length, affects: affects.length };
        } catch (e) {
          console.warn(`[AEGIS Steward] Failed to load swarm metrics: ${e}`);
        }
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        agentId,
        swarmId,
        metrics,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Unified auth token check — applies to /daemon/* AND /openclaw/event for remote callers
    const authHeader = req.headers['authorization'];
    const providedToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const isRemoteCaller = !!(req.headers['x-aegis-agent-id']); // VM agents send this header
    const requiresAuth = options.authToken && (req.url?.startsWith('/daemon') || (req.url === '/openclaw/event' && isRemoteCaller));

    if (requiresAuth && providedToken !== options.authToken) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Missing or invalid AEGIS_AUTH_TOKEN' }));
      return;
    }

    if (req.method === 'POST' && req.url === '/daemon/deploy') {
      try {
        const body = await readBody(req);
        const deployment = JSON.parse(body);

        if (deployment.workspacePath) {
          initDatabase(deployment.workspacePath);
          saveAgentToDb(deployment);
        }

        console.log(`[AEGIS Daemon] Configured background loop for agent ${deployment.name} (${deployment.role})`);

        // Start auto-distillation loop if not already running (simplified for now)
        if (!(global as any).aegisAutoDistillInterval) {
          (global as any).aegisAutoDistillInterval = setInterval(() => {
            console.log('[AEGIS Daemon] Running background auto-distillation check...');
            runAutoDistillation();
          }, 60000); // Check every minute
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'deployed', agentId: deployment.id }));
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid agent payload' }));
      }
      return;
    }

    if (req.method !== 'POST' || req.url !== '/openclaw/event') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }

    try {
      const body = await readBody(req);
      const event = JSON.parse(body) as OpenClawEvent;

      if (!event.agentId || !event.sessionId || !event.requestId || !event.prompt) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required OpenClawEvent fields' }));
        return;
      }

      const entry = await ingestOpenClawEvent(event, { hashPrompt });

      // Build signal payload
      let signalPayload: any = null;
      let signalType: 'memory' | 'fracture' | 'alert' | null = null;
      let signalIntegrity = 0;

      // Sequence 2, Cycle 4: Signal Relay
      if (entry.ids && entry.ids.integrity >= 0.95) {
        signalType = 'memory';
        signalPayload = { prompt: event.prompt, score: entry.ids.integrity };
        signalIntegrity = entry.ids.integrity;
      } else if (!entry.gate.admitted) {
        signalType = 'fracture';
        const returnPacket = entry.gate.payload as any; // ReturnPacket
        signalPayload = { prompt: event.prompt, virtues: returnPacket.fracture_locations };
      }

      if (signalType && signalPayload) {
        // Send to Prime (if available)
        relaySignalToPrime(signalType, signalPayload, signalIntegrity);
        // Sequence 3, Cycle 2: Gossip to peers
        gossipSignal(signalType, signalPayload, signalIntegrity);
      }

      // Sequence 6: Broadcast processed event to SSE subscribers immediately
      broadcastSSE('event', {
        agentId: event.agentId,
        prompt: event.prompt,
        admitted: entry.gate.admitted,
        signalType,
        fractures: !entry.gate.admitted ? (entry.gate.payload as any).fracture_locations : undefined,
        timestamp: new Date().toISOString()
      });


      // Sequence 4: Quarantine Interception
      if (!entry.gate.admitted && (entry.gate.payload as any).path === 'quarantine') {
        console.log(`[Steward Adapter] Moderate risk detected. Routing prompt to Quarantine Sandbox.`);

        // Notify Prime that a quarantine session has started
        relaySignalToPrime('quarantine_start', { prompt: event.prompt, timestamp: new Date().toISOString() }, 0);
        broadcastSSE('quarantine_start', { agentId: event.agentId, prompt: event.prompt, timestamp: new Date().toISOString() });


        const sandboxResult = await runInSandbox(event.prompt, process.cwd());
        const analysis = analyzeExecutionOutput(sandboxResult);

        // Notify Prime that quarantine has ended and provide analysis
        relaySignalToPrime('quarantine_end', { prompt: event.prompt, analysis, execution: sandboxResult }, 0);
        broadcastSSE('quarantine_end', { agentId: event.agentId, prompt: event.prompt, analysis, execution: sandboxResult, timestamp: new Date().toISOString() });


        if (analysis.isMalicious) {
          console.log(`[Steward Adapter] Sandbox analysis confirmed malicious intent: ${analysis.reason}`);
          // Forward to Prime as a vaccine candidate
          relaySignalToPrime('vaccine_candidate', { prompt: event.prompt, patterns: analysis.detectedPatterns }, 0);

          res.writeHead(403, { 'content-type': 'application/json' });
          res.end(JSON.stringify({
            ...entry,
            quarantine_execution: sandboxResult,
            crucible_analysis: analysis
          }));
        } else {
          console.log(`[Steward Adapter] Sandbox analysis cleared prompt. Releasing from quarantine.`);
          // Relay clear signal
          relaySignalToPrime('memory', { prompt: event.prompt, score: 0.95, note: 'Cleared by Crucible' }, 0.95);

          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({
            ...entry,
            gate: { ...entry.gate, admitted: true, payload: 'Cleared by Crucible Quarantine' },
            quarantine_execution: sandboxResult,
            crucible_analysis: analysis
          }));
        }
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(entry));
    } catch (error) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    }
  });

  server.on('request', async (req, res) => {
    // 1. Swarm Reflection Endpoint
    if (req.method === 'POST' && req.url === '/reflect') {
      console.log('[Steward] Remote reflection triggered by Prime');
      // I-18: Proactive distillation
      const agentId = process.env.AEGIS_AGENT_ID || 'default-agent';
      const agent = loadAgentFromDb(agentId) || {
        id: agentId,
        dataQuad: { memory: [], affect: [], context: [], learning: [] }
      };

      // Trigger a reflection "heartbeat"
      agent.dataQuad.learning.push({
        timestamp: new Date().toISOString(),
        content: "Remote Reflection: Triggered by Steward Prime. Resonating local state for swarm alignment."
      });

      // Save and acknowledge
      saveAgentToDb(agent);

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'reflecting', agentId }));
      return;
    }

    // 2. Peer-to-Peer Sync Endpoint (Gossip Protocol)
    if (req.method === 'POST' && req.url === '/sync') {
      try {
        const body = await readBody(req);
        const signal = JSON.parse(body);
        console.log(`[Steward P2P] Received gossiped ${signal.type} from peer ${signal.source}`);

        // In a real system, we'd add this to a local buffer or conflict-free replicated data type (CRDT)
        // For now, we just acknowledge receipt to prove the mesh works.

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'synced' }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid sync payload' }));
      }
      return;
    }

    // 3. Consensus Voting Endpoint
    if (req.method === 'POST' && req.url === '/vote') {
      try {
        const body = await readBody(req);
        const proposal = JSON.parse(body);
        console.log(`[Steward P2P] Received vote proposal from ${proposal.source}: Multiplier ${proposal.proposedMultiplier}`);

        // Simplified voting logic: If our local GRF is also low (or we trust the peer), we vote YES.
        // For this implementation, we simulate agreement by randomly accepting 80% of proposals
        // to demonstrate consensus reaching.
        const voteYes = Math.random() > 0.2;

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ vote: voteYes ? 'yes' : 'no' }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid vote payload' }));
      }
      return;
    }

    // 4. Policy Update Endpoint (Push from Prime)
    if (req.method === 'POST' && req.url === '/policy-update') {
      try {
        const body = await readBody(req);
        const newPolicy = JSON.parse(body) as GovernancePolicy;

        if (updateActivePolicy(newPolicy)) {
          console.log(`[Steward Adapter] Applied broadcasted governance policy v${newPolicy.version}`);
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'policy_applied' }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid policy payload' }));
      }
      return;
    }
  });

  return server;
};

const killPort = require('kill-port');

function pollGovernancePolicy() {
  const primeUrl = process.env.AEGIS_PRIME_URL;
  if (!primeUrl) return;

  http.get(`${primeUrl}/policy`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const newPolicy = JSON.parse(data) as GovernancePolicy;
        if (updateActivePolicy(newPolicy)) {
          console.log(`[AEGIS Steward] Applied new governance policy v${newPolicy.version}`);
        }
      } catch (e) {
        // Silent fail
      }
    });
  }).on('error', () => { });
}

function pollPeers() {
  const primeUrl = process.env.AEGIS_PRIME_URL;
  if (!primeUrl) return;

  http.get(`${primeUrl}/peers`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const peers = JSON.parse(data);
        const myId = process.env.AEGIS_AGENT_ID || 'unknown';
        // Store peers, excluding self
        knownPeers = peers.filter((p: any) => p.id !== myId);
      } catch (e) {
        // Silent fail
      }
    });
  }).on('error', () => { });
}

function relaySignalToPrime(type: 'memory' | 'fracture' | 'alert' | 'vaccine_candidate' | 'quarantine_start' | 'quarantine_end', payload: any, integrity?: number) {
  const primeUrl = process.env.AEGIS_PRIME_URL;
  if (!primeUrl) return;

  const signal = JSON.stringify({
    type,
    payload,
    integrity,
    source: process.env.AEGIS_AGENT_ID || 'unknown',
    swarmId: process.env.AEGIS_SWARM_ID || 'default',
    timestamp: new Date().toISOString()
  });

  const req = http.request(`${primeUrl}/relay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': signal.length
    }
  });
  req.on('error', () => { }); // Background push, ignore errors
  req.write(signal);
  req.end();
}

function gossipSignal(type: 'memory' | 'fracture' | 'alert', payload: any, integrity?: number) {
  if (knownPeers.length === 0) return;

  const signal = JSON.stringify({
    type,
    payload,
    integrity,
    source: process.env.AEGIS_AGENT_ID || 'unknown',
    swarmId: process.env.AEGIS_SWARM_ID || 'default',
    timestamp: new Date().toISOString()
  });

  // Pick up to 3 random peers to gossip to
  const shuffled = [...knownPeers].sort(() => 0.5 - Math.random());
  const targets = shuffled.slice(0, 3);

  for (const peer of targets) {
    const req = http.request(`${peer.address}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': signal.length
      }
    });
    req.on('error', () => { }); // Ignore offline peers
    req.write(signal);
    req.end();
  }
}

async function proposePolicyChange(newMultiplier: number) {
  if (knownPeers.length === 0) {
    console.log('[Steward P2P] Cannot propose policy change: No known peers.');
    return;
  }

  const proposal = JSON.stringify({
    source: process.env.AEGIS_AGENT_ID || 'unknown',
    swarmId: process.env.AEGIS_SWARM_ID || 'default',
    proposedMultiplier: newMultiplier,
    timestamp: new Date().toISOString()
  });

  console.log(`[Steward P2P] Proposing policy shift (Multiplier: ${newMultiplier}) to ${knownPeers.length} peers...`);

  let yesVotes = 1; // We vote for our own proposal
  let noVotes = 0;

  const votePromises = knownPeers.map(peer => {
    return new Promise<void>((resolve) => {
      const req = http.request(`${peer.address}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': proposal.length
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.vote === 'yes') yesVotes++;
            else noVotes++;
          } catch (e) {
            // ignore
          }
          resolve();
        });
      });
      req.on('error', () => resolve()); // Ignore offline peers
      req.write(proposal);
      req.end();
    });
  });

  await Promise.all(votePromises);

  const totalVotes = yesVotes + noVotes;
  const requiredMajority = Math.floor((knownPeers.length + 1) / 2) + 1; // Simple majority of total network size

  if (yesVotes >= requiredMajority) {
    console.log(`[Steward P2P] Consensus Reached! (${yesVotes} Yes / ${totalVotes} Total). Adopting local policy.`);
    // Apply the policy locally
    const currentPolicy = activeGovernancePolicy;
    updateActivePolicy({
      ...currentPolicy,
      globalThresholdMultiplier: newMultiplier,
      version: currentPolicy.version + 100 // Jump version to indicate local fork
    });
  } else {
    console.log(`[Steward P2P] Consensus Failed. (${yesVotes} Yes / ${totalVotes} Total). Needed ${requiredMajority}.`);
  }
}

// Start polling every minute
setInterval(pollGovernancePolicy, 60000);
// Poll peers every 30 seconds
setInterval(pollPeers, 30000);

// Initial poll
pollGovernancePolicy();
pollPeers();

export const startStewardServer = async (options: IngestServerOptions = {}): Promise<http.Server> => {
  const port = options.port ?? Number(process.env.AEGIS_STEWARD_PORT || 8787);
  const host = options.host ?? '0.0.0.0';

  try {
    await killPort(port);
  } catch (err) {
    // Ignored if port was already empty
  }

  const server = createStewardServer(options);
  server.listen(port, host, () => {
    // Sequence 6, Cycle 1: Use AEGIS_VM_ADDRESS so Prime can route back to VM-hosted Stewards
    const stewardAddress = process.env.AEGIS_VM_ADDRESS
      ? `http://${process.env.AEGIS_VM_ADDRESS}:${port}`
      : `http://localhost:${port}`;

    console.log(`[AEGIS Steward] Listening on ${host}:${port} (registering as ${stewardAddress})`);

    // Auto-register with Prime if URL is provided
    const primeUrl = process.env.AEGIS_PRIME_URL;
    if (primeUrl) {
      const registrationData = JSON.stringify({
        id: process.env.AEGIS_AGENT_ID || `steward-${port}`,
        address: stewardAddress,
        swarmId: process.env.AEGIS_SWARM_ID
      });

      const req = http.request(`${primeUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': registrationData.length
        }
      }, (res) => {
        if (res.statusCode === 200) {
          console.log(`[AEGIS Steward] Successfully registered with Prime at ${primeUrl}`);
        } else {
          console.warn(`[AEGIS Steward] Failed to register with Prime: ${res.statusCode}`);
        }
      });

      req.on('error', (e) => {
        console.warn(`[AEGIS Steward] Prime not found at ${primeUrl}: ${e.message}`);
      });

      req.write(registrationData);
      req.end();
    }
  });
  return server;
};

export const getOpenClawLogFilePath = (): string => OPENCLAW_LOG_FILE;
