import { startStewardServer } from '../adapters/openclaw-ingest';

const server = startStewardServer({
  hashPrompt: process.env.AEGIS_HASH_PROMPT !== 'false',
});

const address = server.address();
if (address && typeof address === 'object') {
  console.log(`[AEGIS Steward] Listening on http://${address.address}:${address.port}`);
  console.log('[AEGIS Steward] POST /openclaw/event');
  console.log('[AEGIS Steward] GET /health');
}
