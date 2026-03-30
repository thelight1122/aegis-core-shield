# Agentic Stewardship Integration

This document outlines how **AEGIS Core Shield** can serve as a non-force governance steward for agentic systems such as OpenClaw and their multi-agent fleets. The intent is to run AEGIS alongside an Agentic IDE, protecting integrity while preserving recursive learning memory across each agent’s **DataQuad**.

## Steward Responsibilities

AEGIS acts as a stewardship layer between agent requests and tool execution:

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

AEGIS can log DataQuad snapshots alongside discernment results to preserve recursive learning memory without enforcing directive behavior.

### DataQuad Snapshot Shape

Minimum recommended fields for each DataQuad snapshot:

| Field | Required | Notes |
| --- | --- | --- |
| `temporal` | Yes | Arrays of time-ordered events or intervals |
| `contextual` | Yes | Repo, workspace, dependencies, or tool context |
| `affective` | Yes | Sentiment or affect signals |
| `reflective` | Yes | Lessons, constraints, or self-assessment |

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

AEGIS currently supports these runtime choices:

1. **Alongside OpenClaw**: run AEGIS as a steward sidecar and ingest OpenClaw events over the local HTTP interface.
2. **AEGIS Agentic IDE**: run in native AEGIS IDE mode with steward-managed agent cards under the same discernment gate flow.
3. **Mirror Prime**: observe the broader swarm and continuity surfaces.

The mode selector is available in `src/renderer/Dashboard.tsx`.

## Co-Running with an Agentic IDE

Recommended runtime topology:

```text
Agentic IDE -> AEGIS Gate -> IDS Output -> Agentic Fleet (tools)
                     \-> Append-only Logs (DataQuad + IDS)
```

- **Local process**: run AEGIS in a sidecar process.
- **IPC / HTTP**: use a local socket or HTTP endpoint.
- **Persistence**: append-only JSONL logs for replay and audit.

### Minimal Integration Steps

1. Initialize with `agent_id` and `session_id`.
2. Send prompt plus tool intent to the Discernment Gate.
3. Respect `admitted` versus `returned` outcomes.
4. Persist DataQuad snapshots plus IDS output to JSONL.
5. Periodically replay or summarize DataQuad history.

### Local Steward Server

A minimal ingestion interface is available:

- CLI entrypoint: `npm run steward`
- Health check: `GET /health`
- Event ingest: `POST /openclaw/event`
- Append-only log file: `data/adapter-logs/openclaw-events.jsonl`

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

## Fleet Stewarding Workflow

1. **Intake**: the agent sends prompt plus metadata.
2. **Discern**: the gate scores virtues and admits or returns.
3. **Record**: the decision and DataQuad snapshot are logged.
4. **Reflect**: IDS output is stored and can be fed back into memory.

## Stewarding Boundaries

- **No force**: AEGIS does not override or coerce the agent.
- **Memory integrity**: DataQuad writes are append-only.
- **Agent ownership**: each agent owns its DataQuad and decides how to replay or summarize it.
- **Privacy by default**: store prompt hashes, not raw prompts, unless explicitly configured.

## OpenClaw Adapter Skeleton

Use the adapter skeleton in `src/adapters/openclaw-adapter.ts` as a starting point:

- Map OpenClaw events to `OpenClawEvent`.
- Use `processOpenClawEvent` to run the gate and IDS pipeline.
- Persist the returned `OpenClawLogEntry` to append-only JSONL.
- Expand the DataQuad mapping with your fleet’s domain-specific signals.

## OpenClaw Integration Example

Use the public API to ingest an event directly without HTTP:

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
    reflective: ['previous search succeeded']
  }
});

console.log(entry.gate.admitted);
console.log(entry.ids);
```

Notes:

- prompts are hashed with `sha256` by default and stored as `input.prompt_hash`
- records are appended to `data/adapter-logs/openclaw-events.jsonl`
- set `AEGIS_ADAPTER_LOG_DIR` to override the log destination

## Integration Notes

- **Non-force posture**: returned prompts include observations, never commands.
- **Binary integrity**: all seven virtues must pass for admission.
- **Append-only invariants**: logs remain immutable to preserve integrity.

## Next Steps

- Done: define a DataQuad schema for JSONL logging in `src/adapters/dataquad-schema.ts`.
- Done: add a lightweight local API server in `src/adapters/openclaw-ingest.ts` and `npm run steward`.
- Next: provide adapters for OpenClaw and other agentic frameworks.
- Next: replace local-only sidecar assumptions with the live AEGIS Core service when integration begins.
