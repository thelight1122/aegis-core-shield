# AEGIS Core Shield - Technical Documentation

## Architecture Overview

The AEGIS Core Shield observes inputs (prompts) through a multi-stage validation system consisting of a Tokenizer, a set of Virtue Scorers, a Discernment Gate, and finally the IDS Pipeline.

```text
Raw Input → PEER Capture → Tokenization → Virtue Scoring → Discernment Gate
  → [Path Selection: admitted | shallow-return | deep-return]
  → IDS Pipeline (Universal)
  → Result (IDSResult | ReturnPacket)
```

## System Components

### 1. Tokenization (`src/shared/main/tokenization.ts`)

Translates input strings into structured `Unit` objects. It is capable of detecting and isolating compound phrases along with individual words.

### 2. Seven Virtue Scorers (`src/shared/main/virtue-scoring-*.ts`)

Deterministic, rule-based scoring modules that observe tokenized units from 0.0 to 1.0 across seven distinct virtues:

- Honesty
- Respect
- Attention
- Affection
- Loyalty
- Trust
- Communication

### 3. Discernment Gate (Prism) (`src/shared/main/discernment-gate.ts`)

Computes the final binary Integrity value.
It applies a fixed `TOLERANCE_BAND` (default: 0.10) to all Virtue Scores, meaning any Virtue score ≥ 0.90 is rounded to 1.0.
**Binary Integrity Formula:** `Integrity = Object.values(adjustedScores).every(s => s === 1.0) ? 1 : 0;`

For inputs that do not pass, an observation-only **Return Packet** is generated mapping specific words (units) to fractured virtues. No judgments or directives are issued.

### 4. IDS Processing Pipeline (`src/shared/main/ids-processor.ts`)

A three-phase execution abstraction that executes universally for all inputs:

- **Identify:** Utilizes heuristic pattern matching to observe length, detect imperative vs descriptive constraints, and extract entities.
- **Define:** Explains the structural composition and outlines the context of the user request (e.g., entity-centric inquiry, directive proposal).
- **Suggest:** Produces "optional, non-forced pathways" available for the system to execute, ensuring instructions remain observative.

### 5. Gate Logger (PEER Tensor) (`src/shared/main/gate-logger.ts`)

Persistent logging mechanism writing observations to a JSONL file format, establishing the Present Experiential Emotional Record (PEER). Uses SHA-256 to hash input contents, preserving immutable audit logs. It acts as an append-only contextual tensor without authority or deletion capabilities.

### 6. Stewarding & OpenClaw Ingestion (`src/adapters`)

Bridging integrations designed for OpenClaw agents. `openclaw-adapter.ts` maps OpenClaw events into the core AEGIS engine, persisting to DataQuad compliant schemas via `dataquad-schema.ts`. `openclaw-ingest.ts` starts an HTTP server (default port **8787**, configurable via `AEGIS_STEWARD_PORT`) to continuously ingest events. Employs SSSP (Stable State Snapshot Protocol) to capture pre-escalation configurations.

### 7. Electron Renderer GUI (`src/renderer`)

React GUI layer designed closely with styling modules (`Dashboard.css`). The main piece, `Dashboard.tsx`, constructs standard application interfaces featuring a observation-focused "Nebula Vision" mirroring system depending on calculated coherence and virtue fractures. Includes governance toggles for Custodian Agent operations, Swarm Management, and detailed `AgentCard` visualizations with DataQuad time-scrubbers.

### 8. DataQuad State Persistence

AEGIS captures agent lifecycles via the **DataQuad** schema:

- **Context:** Immediate observational records.
- **Affect:** Long-term emotional resonance maps.
- **Memory:** Retained past states and insights.
- **Learning:** Structural logic modifications.
These tensors are securely serialized and saved automatically into local `.aegis/agents/` JSON structures whenever a Target Workspace is mapped in the UI.

### 9. Reflection Engine (IDR & IDQRA) (`src/shared/main/reflection-engine.ts`)

A fail-safe module triggered when a Swarm routing prompt fractures the Integrity Gate.

- **IDR (Identify, Define, Reflect):** Rapid 3-step sequence used for critical fractures (virtue < 0.5) to restore structural coherence.
- **IDQRA (Identify, Define, Question, Reflect, Acknowledge):** Deep 5-step sequence used for minor drifts (virtue >= 0.5) to expand perspective.

### 10. Secure Tooling & Approval Intercepts

Deployed agents map dynamic tools (`fs-reader`, `fs-writer`, `terminal-executor`). Destructive actions (`!write`, `!cmd`) invoke IPC bindings (`main.ts`, `preload.ts`). Before execution, the Action Intercept queue traps the payload, rendering a Monaco `<DiffEditor />` to compare proposed edits with original workspace content. Approved writes trigger automatic timestamped backups inside `.aegis/backups/`.

### 11. Headless Daemon Integration

Agent execution spans beyond the Electron lifecycle via the `POST /daemon/deploy` API bridge. Front-end `☁️ Daemon` actions rip active contexts and stream them directly onto the stable local Node.js daemon (Port 8787) for uninterrupted headless structural processing.

---

## Immune System Architecture (Sequences 4–6)

The following systems extend AEGIS from a passive gatekeeper into an **active immune system**:

```text
Suspicious Prompt
  → Discernment Gate ("quarantine" path for moderate risk)
  → Sandbox Runner (isolated execution, blocklist enforced, timeout)
  → Crucible Engine (heuristic analysis: exfiltration, port scan, etc.)
  → [If malicious] Prime synthesizes Vaccine → broadcasts to all Stewards
  → Mirror Prime UI: QuarantineHUD | CrucibleLogs | VaccineMap | ConnectionPanel
```

### Sandbox Runner (`src/shared/main/sandbox-runner.ts`)

Executes quarantined commands in an isolated child process with:

- A blocklist of high-risk binaries (`rm -rf`, `dd`, `curl | bash`, etc.)
- A configurable timeout (default 10s)
- Full stdout/stderr capture for Crucible analysis

### Crucible Engine (`src/shared/main/crucible.ts`)

Stateless heuristic analyzer that inspects sandbox output for regex-detected attack patterns:

- Data exfiltration (network connection to unusual hosts)
- Port scanning
- Blocklist violations
- Returns `{ isMalicious, reason, detectedPatterns, severity }`

### Vaccine Synthesis (`src/shared/main/steward-prime.ts`)

When a Crucible result confirms malicious intent, Prime:

1. Extracts detected patterns as a Vaccine
2. Appends them to `activePolicy.blacklistedPatterns`
3. Broadcasts the updated policy to all registered Stewards via `/policy-update`

### VM Remote Integration

| Env Variable | Purpose | Default |
|---|---|---|
| `AEGIS_STEWARD_PORT` | Steward listen port | `8787` |
| `AEGIS_VM_ADDRESS` | Externally-routable host IP for Prime registration | `localhost` |
| `AEGIS_AUTH_TOKEN` | Bearer token for `/openclaw/event` remote calls | (none) |
| `AEGIS_CORS_ORIGIN` | Value for `Access-Control-Allow-Origin` header | `*` |
| `AEGIS_PRIME_URL` | URL of the Mirror Prime orchestrator | (none) |
| `AEGIS_AGENT_ID` | Identity of this Steward node | `default-agent` |
| `AEGIS_SWARM_ID` | Swarm this Steward belongs to | (none) |
