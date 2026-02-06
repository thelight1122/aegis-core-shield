// src/cli/index.ts
// Purpose: CLI entry point for testing Discernment Gate + IDS pipeline
// Usage: npm run gate "your prompt here"
// Validates complete gate→IDS flow per AEGIS calling pattern

import { discernmentGate } from '../shared/main/discernment-gate';
import { processPrompt } from '../shared/main/ids-processor';

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npm run gate "your prompt here"');
    console.log('Examples:');
    console.log('  npm run gate "The sky is blue today"');
    console.log('  npm run gate "You must update the config now"');
    process.exit(1);
  }

  const prompt = args.join(' ');

  console.log('┌─ Input Prompt');
  console.log('│');
  console.log('└─ ' + prompt);
  console.log('');

  const result = processPrompt(prompt);

  console.log('┌─ Gate Decision');
  if ('phase' in result && result.phase === 'suggest') {
    // IDS result (admitted)
    console.log('│ Admitted – prompt passed integrity check');
    console.log('│');
    console.log('├─ IDS Result');
    console.log('│ Phase: ' + result.phase);
    console.log('│ Observations:');
    result.observations.forEach((obs: string) => console.log('│   - ' + obs));
    console.log('│');
    console.log('└─ Output: ' + result.output);
  } else if ('status' in result && result.status === 'discernment_gate_return') {
    // Return packet (returned)
    console.log('│ Returned – resonance not fully achieved');
    console.log('│');
    console.log('└─ Return Packet');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('│ Error: unexpected result format');
    console.log('└─ ' + JSON.stringify(result, null, 2));
  }

  console.log('');
  console.log('Test complete. Integrity preserved.');
}

main();
