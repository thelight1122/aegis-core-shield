import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

import { OpenClawEvent, OpenClawLogEntry, OpenClawAdapterOptions, processOpenClawEvent } from './openclaw-adapter';

const ADAPTER_LOG_DIR = process.env.AEGIS_ADAPTER_LOG_DIR || path.join(process.cwd(), 'data', 'adapter-logs');
const OPENCLAW_LOG_FILE = path.join(ADAPTER_LOG_DIR, 'openclaw-events.jsonl');

export interface IngestServerOptions extends OpenClawAdapterOptions {
  port?: number;
  host?: string;
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

export const startStewardServer = (options: IngestServerOptions = {}): http.Server => {
  const port = options.port ?? Number(process.env.AEGIS_STEWARD_PORT || 8787);
  const host = options.host ?? '0.0.0.0';

  const server = createStewardServer(options);
  server.listen(port, host);
  return server;
};

export const getOpenClawLogFilePath = (): string => OPENCLAW_LOG_FILE;
