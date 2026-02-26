import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('openclaw ingest', () => {
  const originalLogDir = process.env.AEGIS_ADAPTER_LOG_DIR;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-adapter-'));
    process.env.AEGIS_ADAPTER_LOG_DIR = tempDir;
    jest.resetModules();
  });

  afterEach(() => {
    if (originalLogDir === undefined) {
      delete process.env.AEGIS_ADAPTER_LOG_DIR;
    } else {
      process.env.AEGIS_ADAPTER_LOG_DIR = originalLogDir;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('ingestOpenClawEvent appends JSONL entry', () => {
    const {
      ingestOpenClawEvent,
      getOpenClawLogFilePath,
    } = require('./openclaw-ingest') as typeof import('./openclaw-ingest');

    const entry = ingestOpenClawEvent({
      agentId: 'agent-10',
      sessionId: 'session-10',
      requestId: 'req-10',
      prompt: 'The weather is nice today.',
    });

    expect(entry.agent_id).toBe('agent-10');

    const logPath = getOpenClawLogFilePath();
    expect(fs.existsSync(logPath)).toBe(true);

    const raw = fs.readFileSync(logPath, 'utf8').trim();
    const parsed = JSON.parse(raw);
    expect(parsed.request_id).toBe('req-10');
    expect(parsed.input.prompt_hash).toMatch(/^sha256:/);
  });

  test('createStewardServer handles health and validation failures', async () => {
    const { createStewardServer } = require('./openclaw-ingest') as typeof import('./openclaw-ingest');

    const server = createStewardServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected TCP address');
    }

    const base = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${base}/health`);
    expect(health.status).toBe(200);

    const bad = await fetch(`${base}/openclaw/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentId: 'a' }),
    });

    expect(bad.status).toBe(400);

    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });
});
