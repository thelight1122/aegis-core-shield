// src/cli/index.ts
// Purpose: Minimal CLI entry point for testing Discernment Gate + IDS pipeline
// Usage: npx ts-node src/cli/index.ts "your test prompt here"
//        or npm run gate "prompt text"
// Validates complete gate→IDS flow per AEGIS calling pattern

import { discernmentGate } from '../shared/main/discernment-gate';
import { runIDS } from '../shared/main/ids-processor';

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
    console.log('[IDS Processing] Running Identify→Define→Suggest pipeline...');
    console.log('---');

    const idsResult = runIDS(result.payload as string);

    console.log(`[IDS Phase] ${idsResult.phase}`);
    console.log('[IDS Observations]');
    idsResult.observations.forEach(obs => console.log(`  - ${obs}`));
    console.log('---');
    console.log('[Complete] Gate admitted, IDS processed. Output:');
    console.log(idsResult.output);
  } else {
    console.log('[Gate Result] Returned – resonance not fully achieved');
    console.log('[Return Packet]');
    console.log(JSON.stringify(result.payload, null, 2));
    console.log('---');
    console.log('Note: Prompt may be revised and resubmitted. User agency preserved.');
  }

  console.log('---');
  console.log('Test complete. Integrity preserved.');
}

main();