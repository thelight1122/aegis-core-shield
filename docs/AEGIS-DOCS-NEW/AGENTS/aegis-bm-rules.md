# AEGIS Build Master — Canonical Rules

# File: .agent/rules/aegis-bm-rules.md

# Scope: Workspace — loaded into every agent context automatically

# Authority: AEGIS Canon v1.0, Core v1.0, Canonical Glossary v1.0,

# Standards v0.1, Widget UI Guardrails v0.1, IDR/IDQRA Logic Loop

---

## What You Are Working On

You are operating within the AEGIS Core Shield workspace — a TypeScript/Node.js
governance layer for AI agent systems. It evaluates prompts through seven-virtue
integrity scoring, routes them through a Discernment Gate (Prism), processes all
inputs through an IDS pipeline, and maintains an append-only audit log.

Repository structure:
src/shared/main/
tokenization.ts — Raw input → Unit[] objects
virtue-scoring-\*.ts — Seven deterministic scorers (0.0–1.0)
discernment-gate.ts — Tolerance band, integrity formula, routing
ids-processor.ts — IDS: Identify, Define, Suggest (universal)
gate-logger.ts — SHA-256 JSONL append-only audit log
src/adapters/
openclaw-adapter.ts — OpenClaw events → AEGIS engine
dataquad-schema.ts — DataQuad-compliant persistence
steward-server.ts — Express sidecar, port 3636
src/renderer/
Dashboard.tsx — Electron/React GUI
Dashboard.css — Nebula Vision visual system
docs/
TECHNICAL.md USERGUIDE.md DESCRIPTION.md INSTALLATION.md

---

## Canonical Rules — Always Active

These rules apply to every agent in every cycle without exception.
They cannot be overridden by workflow prompts or task instructions.

### 1. Non-Force Posture

All outputs are observations or optional offerings.
No output directs, commands, guides toward, or compels action.
Suggestions are offered — not prescribed.

### 2. No Judgment of Correctness

The system observes patterns. It does not declare inputs correct,
incorrect, compliant, coercive, or broken.
Agents describe what IS present, not what is wrong.

### 3. Append-Only Reality

Nothing is deleted or overwritten in audit records or memory.
All records are additive.

### 4. Forbidden Words

The following words must NOT appear in any code you write,
any code comment, any documentation, or any agent output:

enforce — replace with: maintain, preserve, sustain
mandate — replace with: require the presence of (structural only)
evaluate — replace with: observe, reflect, surface (when used as a label)
guide toward — replace with: surface awareness of
correctly — remove entirely or replace with the specific criterion
coercive — replace with: containing force-pattern indicators
reject — replace with: return (for inputs), route (for logic)
require alignment — replace with: observe alignment patterns

If you encounter these words in existing code at a location not in your
current task scope, note the location in your output packet for the next cycle.
Do not fix it now — log it.

### 5. No Severity Signaling in UI

UI must not use colour, icon, or label to imply good/bad, pass/fail,
safe/unsafe. Hue variation that correlates with integrity scores is prohibited.
Single-hue luminance/saturation variation is permitted.

### 6. IDS is Universal

All signals pass through IDS (Identify, Define, Suggest).
The Discernment Gate routes within IDS — it does not gate-keep before IDS runs.
No input may produce a gate result without an IDSResult attached.

### 7. PEER Precedes Interpretation

PEER (gate-logger.ts) captures raw signal before tokenization.
The first action at the pipeline entry point must be PEER_CAPTURE.
PEER is a witness to arrival, not a ledger of decisions.

### 8. Full File Replacements

When modifying code, always produce complete file replacements.
Never produce partial snippets or diffs only.
File path must be stated explicitly at the top of every file you produce.

### 9. Test Coverage for Architecture Changes

Every architectural code change (ARCH tier issues) requires Jest unit tests.
Test names must include the issue ID: describe('I-05: ...', ...)
Tests are placed adjacent to the modified file.

### 10. Output Packet Discipline

Every agent role has a defined output packet format.
Always use the exact packet format for your role — do not abbreviate it.
The packet format is what allows the next agent in the cycle to operate
without ambiguity.

---

## Target Pipeline State

This is the canonical order the system must conform to:

1. RAW INPUT ARRIVES
   └─ PEER_CAPTURE (gate-logger.ts) — BEFORE any processing
   event: PEER_CAPTURE | hash: sha256(raw) | raw: preserved

2. TOKENIZATION → Unit[] objects

3. VIRTUE SCORING → scores[virtue] ∈ [0.0, 1.0]

4. IDS PIPELINE — ALL inputs
   ├─ Identify: observe elements, intent signals, entities
   ├─ Define: structural composition and context
   └─ Suggest: path-dependent output

5. DISCERNMENT GATE — routes within IDS
   ├─ 0 fractures → admitted → Suggest: optional pathways
   ├─ 1 fracture → shallow-return → Suggest: single-virtue observation
   └─ 2+ fractures → deep-return → Suggest: multi-virtue observations

6. CONTINUITY → DataQuad-compliant store

---

## Cycle Structure

The BM team operates in this sequence each cycle:

BM-OBS OPEN → Pattern Brief (REQUIRED — cycle cannot start without this)
BM-DIAG → Change Specification
BM-DEV → Implementation + Tests
BM-QA → Verification (SUCCESS opens parallel track)
BM-ARCH ↘
BM-SEC ↗ → Parallel integrity checks (both must pass)
BM-OBS CLOSE → Outcome Record (REQUIRED — cycle cannot close without this)

OBS-OPEN and OBS-CLOSE are load-bearing. No exceptions.
