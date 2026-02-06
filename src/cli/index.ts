// src/cli/index.ts
// Purpose: Minimal CLI entry point for testing Discernment Gate
// Usage: npx ts-node src/cli/index.ts "your test prompt here"
//        or npm run gate "prompt text"
// Validates gate behavior without GUI or IDS downstream

import { discernmentGate } from '../main/discernment-gate';

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx ts-node src/cli/index.ts "your prompt here"');
    console.log('Example: npx ts-node src/cli/index.ts "The weather is nice today"');
    process.exit(1);
  }

  const prompt = args.join(' ');

  console.log('[Gate Test] Input prompt:');
  console.log(prompt);
  console.log('---');

  const result = discernmentGate(prompt);

  if (result.admitted) {
    console.log('[Gate Result] Admitted – prompt passes integrity check');
    console.log('Proceeding to IDS would occur here in full app');
  } else {
    console.log('[Gate Result] Returned – resonance not fully achieved');
    console.log(JSON.stringify(result.payload, null, 2));
  }

  console.log('---');
  console.log('Test complete. Integrity preserved.');
}

main();