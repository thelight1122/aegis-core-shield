# docs/discernment-gate-integration.md

## Discernment Gate – Integration & Branching Logic (v0.1)

This document describes how the Discernment Gate connects to the rest of the system (IDS, CLI, GUI, API handler).

### Gate Interface (pseudo-code shape)

The gate is a pure function:

```ts
interface GateResult {
  admitted: boolean;
  payload: string | ReturnPacket;
}

function discernmentGate(prompt: string): GateResult {
  // Fast pre-filter
  if (isTrivialOrEmpty(prompt)) {
    return { admitted: true, payload: prompt };
  }

  // Tokenize & unitize
  const units = tokenizeAndChunk(prompt);

  // Score virtues (per-unit, per-virtue)
  const virtueScores = scoreVirtues(units);

  // Apply tolerance band & aggregate weakest link per virtue
  const adjustedScores = applyTolerance(virtueScores);

  // Binary Integrity gate
  const integrity = computeIntegrity(adjustedScores); // 1 or 0

  if (integrity === 1) {
    // Silent admit – no logging unless verbose
    return { admitted: true, payload: prompt };
  } else {
    // Generate neutral return packet
    const returnPacket = generateReturnPacket(adjustedScores, units, prompt);
    logGateDecision(returnPacket, prompt);
    return { admitted: false, payload: returnPacket };
  }
}