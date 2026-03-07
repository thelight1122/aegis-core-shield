import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

import { OpenClawEvent, OpenClawLogEntry, OpenClawAdapterOptions, processOpenClawEvent } from './openclaw-adapter';
import { initDatabase, saveAgentToDb } from '../shared/main/db/database';
import { runAutoDistillation } from '../shared/main/auto-distill';

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

export const ingestOpenClawEvent = (
  event: OpenClawEvent,
  options: OpenClawAdapterOptions = {}
): OpenClawLogEntry => {
  const entry = processOpenClawEvent(event, options);
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

export const createStewardServer = (options: IngestServerOptions = {}): http.Server => {
  const hashPrompt = options.hashPrompt;

  return http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Token check for daemon actions
    const authHeader = req.headers['authorization'];
    const providedToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (req.url?.startsWith('/daemon') && options.authToken && providedToken !== options.authToken) {
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

      const entry = ingestOpenClawEvent(event, { hashPrompt });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(entry));
    } catch (error) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    }
  });
};

const killPort = require('kill-port');

export const startStewardServer = async (options: IngestServerOptions = {}): Promise<http.Server> => {
  const port = options.port ?? Number(process.env.AEGIS_STEWARD_PORT || 8787);
  const host = options.host ?? '0.0.0.0';

  try {
    await killPort(port);
  } catch (err) {
    // Ignored if port was already empty
  }

  const server = createStewardServer(options);
  server.listen(port, host);
  return server;
};

export const getOpenClawLogFilePath = (): string => OPENCLAW_LOG_FILE;
