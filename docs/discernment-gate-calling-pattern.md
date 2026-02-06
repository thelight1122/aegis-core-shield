# docs/discernment-gate-calling-pattern.md

## Discernment Gate – Calling Pattern (CLI / GUI / API Handler)

This document shows how the rest of the application calls the Discernment Gate.

The gate is called before any IDS processing begins.  
It returns either the original prompt (admitted) or a return packet (fracture observed).

### TypeScript Calling Pattern (reference implementation shape)

```ts
// Example usage in CLI, GUI renderer, or API endpoint handler

import { discernmentGate } from '../main/discernment-gate'; // future import path

async function processUserPrompt(rawPrompt: string) {
  const result = discernmentGate(rawPrompt);

  if (result.admitted) {
    // Gate passed → safe to proceed to IDS phases
    const identified = identify(result.payload);      // IDS step 1
    const defined    = define(identified);            // IDS step 2
    const suggested  = suggest(defined);              // IDS step 3

    // Return final output to user (CLI print, GUI display, API response)
    returnToUser(suggested);
  } else {
    // Gate returned packet → show / send to user
    displayOrSendReturnPacket(result.payload);

    // Optional: log the return for audit
    logReturnPacket(result.payload);
  }
}

// Helper stubs (defined elsewhere)
function identify(prompt: string) { /* ... */ }
function define(identified: any) { /* ... */ }
function suggest(defined: any) { /* ... */ }
function returnToUser(output: any) { /* CLI/GUI/API send */ }
function displayOrSendReturnPacket(packet: ReturnPacket) { /* show modal, print JSON, etc. */ }
function logReturnPacket(packet: ReturnPacket) { /* append to gate log */ }