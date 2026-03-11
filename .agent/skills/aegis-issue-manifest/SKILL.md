# AEGIS Issue Manifest — Cycle 1

---

**FILE:** .agent/skills/aegis-issue-manifest/SKILL.md
**SCOPE:** Workspace skill — loaded on demand when agents need issue detail
**LOADED_BY:** BM-DIAG, BM-DEV, BM-QA

---

## 1. I-01 — User Guide: Prohibited Language

- **TIER:** DOC
- **FILE:** [USERGUIDE.md](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/docs/USERGUIDE.md)

| Current (OUT OF SPEC) | Required Replacement |
| :--- | :--- |
| help refine, evaluate, and guide prompts | support observation and reflection of prompts |
| guide prompts toward a safe, coherent, and highly transparent system response mapping | surface coherence and fracture observations for transparent system response mapping |
| guide the user on how to realign the prompt correctly | return observations about the signal patterns present |
| Returns a formatted Return Packet with the underlying reason for returning | Returns a formatted Return Packet with observations about signal patterns that produced fractures |

- **ACCEPTANCE:** grep USERGUIDE.md for `evaluate`, `guide toward`, `correctly`, `realign correctly` — zero results. Introduction reads with no directive or judgmental framing.

---

## 2. I-02 — Installation: 'Coercive prompt' Label

- **TIER:** DOC
- **FILE:** [INSTALLATION.md](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/docs/INSTALLATION.md)

| Current (OUT OF SPEC) | Required Replacement |
| :--- | :--- |
| `# Example: Coercive prompt (returned)` | `# Example: Prompt containing force-pattern indicators (returned)` |

- **ACCEPTANCE:** grep INSTALLATION.md for `Coercive prompt`, `coercive` — zero results.

---

## 3. I-03 — Technical Docs: 'enforce' Prohibited

- **TIER:** DOC
- **FILE:** [TECHNICAL.md](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/docs/TECHNICAL.md)

| Current (OUT OF SPEC) | Required Replacement |
| :--- | :--- |
| enforce DataQuad logging | maintain DataQuad logging continuity |
| Any further instance of `enforce` as system verb | preserve / maintain / sustain / ensure continuity of |

- **ACCEPTANCE:** grep TECHNICAL.md for `enforce`, `mandate` — zero results as system verbs.

---

## 4. I-04 — PEER Capture Must Precede All Processing

- **TIER:** ARCH
- **FILES:** [gate-logger.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/gate-logger.ts), entry point

- **PROBLEM:** gate-logger.ts records gate outcomes. PEER must capture raw signal BEFORE tokenization. PEER_CAPTURE must be the first action at the entry point.

- **REQUIRED CODE PATTERN:**

```typescript
export async function processInput(rawInput: string) {
  // FIRST ACTION: PEER capture before any processing
  await gateLogger.append({
    event: "PEER_CAPTURE",
    timestamp: new Date().toISOString(),
    hash: sha256(rawInput),
    raw: rawInput,
  });
  const units = tokenize(rawInput);
  const scores = scoreVirtues(units);
  return runIDSWithGate(rawInput, units, scores);
}
```

- **ACCEPTANCE:** Unit test confirms first JSONL entry for any input is event type `PEER_CAPTURE` containing raw hash. Test name: `I-04: PEER_CAPTURE precedes all processing`.

---

## 5. I-05 — IDS Must Run Universally

- **TIER:** ARCH
- **FILES:** [ids-processor.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/ids-processor.ts), [discernment-gate.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/discernment-gate.ts)

- **PROBLEM:** IDS currently runs only on admitted inputs. All signals must pass through IDS.

- **REQUIRED CODE PATTERN:**

```typescript
export type IDSPath = "admitted" | "shallow-return" | "deep-return";

export function runIDS(input: string, units: Unit[], path: IDSPath): IDSResult {
  const identified = identify(units); // ALL inputs
  const defined = define(identified); // ALL inputs
  const suggestions =
    path === "admitted"
      ? suggestPathways(defined)
      : suggestFractureObservations(defined, path);
  return { path, identified, defined, suggestions };
}

export function discernmentGate(
  raw: string,
  units: Unit[],
  scores: VirtueScores,
) {
  const adjusted = applyToleranceBand(scores, TOLERANCE_BAND);
  const fractures = countFractures(adjusted);
  const path: IDSPath =
    fractures === 0
      ? "admitted"
      : fractures === 1
        ? "shallow-return"
        : "deep-return";
  return {
    path,
    integrity: fractures === 0 ? 1 : 0,
    adjusted,
    idsResult: runIDS(raw, units, path),
  };
}
```

- **ACCEPTANCE:** Tests confirm admitted and returned inputs both produce full IDSResult. Test prefix: `I-05:`.

---

## 6. I-06 — Return Packet Must Declare IDS Origin

- **TIER:** ARCH
- **FILES:** [ids-processor.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/ids-processor.ts), [discernment-gate.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/discernment-gate.ts)

- **PROBLEM:** Return Packet suggestions have no declared origin. source: 'IDS' must be explicit.

- **REQUIRED TYPE:**

```typescript
export interface ReturnPacket {
  source: "IDS";
  path: "shallow-return" | "deep-return";
  depth: "shallow" | "deep";
  fracture_locations: FractureMap;
  ids_observations: IDSResult;
}
```

- **ACCEPTANCE:** `ReturnPacket.source === 'IDS'`. No suggestion logic outside ids-processor.ts. Test prefix: `I-06:`.

---

## 7. I-07 — Nebula Vision: Remove Severity Colour Shifts

- **TIER:** UI
- **FILES:** [Dashboard.tsx](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/renderer/Dashboard.tsx), [Dashboard.css](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/renderer/Dashboard.css)

- **PROBLEM:** Hue shifts (red/amber/green) per integrity score encode good/bad valence — prohibited by Widget UI Guardrails.

| Current (OUT OF SPEC) | Required Replacement |
| :--- | :--- |
| Hue shifts red/amber/green per score | Single-hue saturation variation only. No red/green valence. |
| Colour encodes fracture presence as severity | Opacity or saturation for intensity — no valence. Document encoding in code comment. |
| No explanatory label | Add: `Signal coherence pattern — reflects signal structure, not quality.` |

- **ACCEPTANCE:** Visual review — reviewer cannot determine admitted vs returned from visual alone without reading text output. Label visible in default view.

---

## 8. I-08 — Proportional Routing: Replace Pure Binary Gate

- **TIER:** ARCH
- **FILES:** [discernment-gate.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/discernment-gate.ts), [ids-processor.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/ids-processor.ts)

- **PROBLEM:** All non-admitted inputs return identically regardless of fracture count. Three-path routing needed.

- **REQUIRED ROUTING LOGIC:**

```typescript
function computePath(adjusted: AdjustedScores): IDSPath {
  const n = Object.values(adjusted).filter((s) => s < 1.0).length;
  return n === 0 ? "admitted" : n === 1 ? "shallow-return" : "deep-return";
}
```

- **ROUTING RULES:**
  - 0 fractures → admitted
  - 1 fracture → shallow-return
  - 2+ fractures → deep-return

- **ACCEPTANCE:** Three-path tests pass. `result.admitted` backward-compatible. `ReturnPacket.depth` field present. Test prefix: `I-08:`.
