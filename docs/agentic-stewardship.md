# Agentic Stewardship Integration (Draft)

This document outlines how **AEGIS Core Shield** can serve as a non-force governance steward for agentic systems (e.g., OpenClaw) and their multi-agent fleets. The intent is to run AEGIS alongside an Agentic IDE, protecting integrity while preserving recursive learning memory across each agent’s **DataQuad** (temporal, contextual, affective, and reflective memory).

## Steward Responsibilities

AEGIS acts as a **steward layer** between agent requests and tool execution:

1. **Discernment Gate** checks incoming prompts for seven-virtue integrity.
2. **IDS Pipeline** outputs non-force observations and suggestions.
3. **Memory Stewardship** records accepted prompts, return packets, and IDS outputs into append-only logs for long-horizon recall.

## DataQuad Memory Model

Each agent maintains a DataQuad bundle:

| Dimension | Purpose | Example Payload |
| --- | --- | --- |
| Temporal | Sequencing and recurrence | recent actions, cadence signals |
| Contextual | Environment and task state | repo, workspace, dependencies |
| Affective | Tone and sentiment resonance | trust/affection deltas |
| Reflective | Self-assessment and lessons | what worked, what broke |

AEGIS can log DataQuad snapshots alongside the discernment results to preserve **recursive learning memory** without enforcing any directive behavior.

### DataQuad Snapshot Shape

Minimum recommended fields for each DataQuad snapshot:

| Field | Required | Notes |
| --- | --- | --- |
| `temporal` | ✅ | Arrays of time-ordered events or intervals |
| `contextual` | ✅ | Repo, workspace, dependencies, or tool context |
| `affective` | ✅ | Sentiment/affect signals (scaled or categorical) |
| `reflective` | ✅ | Lessons, constraints, or self-assessment |

### Draft JSONL Envelope

Store each event as an append-only JSONL record:

```json
{
  "ts": "2026-02-09T12:34:56.000Z",
  "agent_id": "fleet/agent-07",
  "session_id": "session-20260209-1234",
  "request_id": "req-8f2d",
  "gate": {
    "admitted": true,
    "virtues": {
      "honesty": 1.0,
      "respect": 1.0,
      "attention": 1.0,
      "affection": 1.0,
      "loyalty": 1.0,
      "trust": 1.0,
      "communication": 1.0
    }
  },
  "ids": {
    "identify": "...",
    "define": "...",
    "suggest": "..."
  },
  "input": {
    "prompt_hash": "sha256:...",
    "tool_intent": "repo.search"
  },
  "dataquad": {
    "temporal": ["..."],
    "contextual": ["..."],
    "affective": ["..."],
    "reflective": ["..."]
  }
}
```

This layout keeps every decision auditable while allowing agents to replay or summarize memory across time windows without leaking prompt content.

## Runtime Modes

AEGIS now supports two runtime choices for developers:

1. **Alongside OpenClaw**: Run AEGIS as a steward sidecar and ingest OpenClaw events over the local HTTP interface.
2. **AEGIS Agentic IDE**: Run in native AEGIS IDE mode with steward-managed agent cards (Steward, Research, Builder) under the same discernment gate flow.

The mode selector is available in the GUI dashboard (`src/renderer/Dashboard.tsx`).

## Co-Running with an Agentic IDE

Recommended runtime topology:

```text
Agentic IDE → AEGIS Gate → IDS Output → Agentic Fleet (tools)
                      ↘  Append-only Logs (DataQuad + IDS)
```

- **Local process**: Run AEGIS in a sidecar process.
- **IPC**: Use a local socket/HTTP endpoint (v0.2+ planned).
- **Persistence**: Append-only JSONL logs for safe replay and time-based audits.

### Minimal Integration Steps

1. **Initialize**: Provide `agent_id` and `session_id` to AEGIS.
2. **Send**: Submit prompt + tool intent to the Discernment Gate.
3. **Gate**: Respect `admitted` vs. `returned` decisions.
4. **Persist**: Append DataQuad snapshots + IDS output to JSONL.
5. **Replay**: Periodically summarize or replay DataQuad history.


### Local Steward Server (Step 3)

A minimal ingestion interface is now available:

- CLI entrypoint: `npm run steward`
- Health check: `GET /health`
- Event ingest: `POST /openclaw/event`
- Append-only log file: `data/adapter-logs/openclaw-events.jsonl` (or `AEGIS_ADAPTER_LOG_DIR` override)

Example request:

```bash
curl -X POST http://127.0.0.1:8787/openclaw/event \
  -H 'content-type: application/json' \
  -d '{
    "agentId":"fleet/agent-01",
    "sessionId":"session-001",
    "requestId":"req-001",
    "prompt":"The weather is nice today.",
    "toolIntent":"repo.search"
  }'
```

## Fleet Stewarding Workflow (High-Level)

1. **Intake**: Agent sends prompt + metadata (agent id, tool intent).
2. **Discern**: Gate scores virtues, admits or returns.
3. **Record**: Log decision + DataQuad snapshot.
4. **Reflect**: IDS output is stored and optionally fed into the agent memory stack.

## Stewarding Boundaries

- **No force**: AEGIS does not override or coerce the agent. It only observes and suggests.
- **Memory integrity**: DataQuad writes are append-only and immutable once persisted.
- **Agent ownership**: Each agent owns its DataQuad and can choose how to replay or summarize it.
- **Privacy-by-default**: Store prompt hashes, not raw prompts, unless explicitly configured.

## OpenClaw Adapter Skeleton

Use the adapter skeleton in `src/adapters/openclaw-adapter.ts` as a starting point:

- Map OpenClaw events to `OpenClawEvent`.
- Use `processOpenClawEvent` to run the gate and IDS pipeline.
- Persist the returned `OpenClawLogEntry` to append-only JSONL.
- Expand the DataQuad mapping to include your fleet’s domain-specific signals.


## OpenClaw Integration Example (Copy/Paste)

Use the public API to ingest an event directly (without HTTP):

```ts
import { ingestOpenClawEvent } from 'aegis-core-shield';

const entry = ingestOpenClawEvent({
  agentId: 'fleet/agent-01',
  sessionId: 'session-001',
  requestId: 'req-001',
  prompt: 'The weather is nice today.',
  toolIntent: 'repo.search',
  dataquad: {
    temporal: ['t:2026-02-10T10:00:00Z'],
    contextual: ['repo:aegis-core-shield'],
    affective: ['calm'],
    reflective: ['previous search succeeded'],
  },
});

console.log(entry.gate.admitted); // true|false
console.log(entry.ids); // present only when admitted
```

Notes:
- By default, prompts are hashed (`sha256`) and stored as `input.prompt_hash`.
- Records are appended to `data/adapter-logs/openclaw-events.jsonl`.
- Set `AEGIS_ADAPTER_LOG_DIR` to override log destination.

## Integration Notes

- **Non-force posture**: Returned prompts include observations, never commands.
- **Binary integrity**: All seven virtues must pass for admission.
- **Append-only invariants**: Logs remain immutable to preserve integrity.

## Next Steps

- ✅ Define a DataQuad schema for JSONL logging (`src/adapters/dataquad-schema.ts`).
- ✅ Add a lightweight local API server (`src/adapters/openclaw-ingest.ts`, `npm run steward`).
- Provide adapters for OpenClaw and other agentic frameworks.
