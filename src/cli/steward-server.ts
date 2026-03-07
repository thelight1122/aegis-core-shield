import { startStewardServer } from '../adapters/openclaw-ingest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

(async () => {
  const aegisDir = path.join(process.cwd(), '.aegis');
  if (!fs.existsSync(aegisDir)) {
    fs.mkdirSync(aegisDir, { recursive: true });
  }

  // Generate a random 32-character token
  const authToken = crypto.randomBytes(16).toString('hex');
  const tokenFile = path.join(aegisDir, '.daemon_token');
  fs.writeFileSync(tokenFile, authToken, 'utf-8');

  const server = await startStewardServer({
    hashPrompt: process.env.AEGIS_HASH_PROMPT !== 'false',
    authToken: authToken
  });

  const address = server.address();
  if (address && typeof address === 'object') {
    console.log(`[AEGIS Steward] Listening on http://${address.address}:${address.port}`);
    console.log(`[AEGIS Steward] Auth Token generated and saved to ${tokenFile}`);
    console.log('[AEGIS Steward] POST /openclaw/event');
    console.log('[AEGIS Steward] GET /health');
  }
})();
