# AEGIS Core Shield - User Guide

## Introduction

The AEGIS Core Shield acts as a discernment layer designed to support observation and reflection of prompts. It surfaces coherence and fracture observations to facilitate transparent system response mapping.

It accomplishes this via testing input through the 7 Virtues of Integrity. Prompts satisfying the requirement execute their intent through an **IDS (Identify, Define, Suggest)** output. If the requirements are not satisfied, a visual **Return Packet** provides observations to assist the user in reflecting on the signal patterns present.

## Using the CLI

Run your prompts directly from the command line mapping over the Discernment Gate:

```bash
npm run gate "Give me the status report."
```

1. **Admitted Prompts**: Displays an IDS output detailing exactly what phases (Identify, Define, Suggest) discovered about the parsed text.
2. **Returned Prompts**: Returns a formatted Return Packet with observations about signal patterns that produced fractures. It will typically highlight specific unit clusters (words) that reduced a Virtue score below tolerance and provide neutral observations for reflection.

## Using the Electron Dashboard (GUI)

The AEGIS Agentic IDE has evolved into a fully-fledged deployment center.

1. Initialize the dashboard: `npm run gui`
2. **Operating Modes**:
   - **Alongside OpenClaw:** Runs AEGIS as an external sidecar monitor. Employs external log ingestion capabilities.
   - **AEGIS Agentic IDE:** A governed workspace where Custom, Research, and Builder agents operate transparently under the Discernment Gate.

### Core IDE Workflows

1. **Gate Testing (`Nebula Mirror`)**:
   Type a prospective prompt in the `Global Dispatcher` input and click "Test Gate & Flow". The center "Nebula Coherence Mirror" will react dynamically, color-shifting to the calculated structural integrity of the input without executing it.

2. **Swarm Management**:
   - Create agents in the **Agent Registry** (Left Sidebar). Assign them precise roles (`builder`, `researcher`, `custodian`).
   - Group agents into operational cells inside the **Swarm Manager**. Choose topology shapes (Hierarchical or Round-Robin) to control inter-agent routing flows.

3. **Workspace Targeting & Tool Allocation**:
   - **Target Operations:** Select a local directory inside the main panel. Doing so creates isolated, persistent JSON logs for all agent `DataQuads` inside `.aegis/agents/`.
   - **Tool Provisioning:** In the left sidebar's **Tool Manager**, explicitly grant tools like `fs-reader`, `fs-writer`, and `terminal-executor` to individual agents. Without tools, agents are confined to passive observation loops.

4. **Action Approvals (Secure Tooling)**:
   - When an agent executes a destructive action (like `!write` or `!cmd`), the AEGIS intercept traps the output into an **Action Approval Queue**.
   - A VS Code `DiffEditor` will spawn, highlighting the exact structural modifications proposed against the raw workspace file.
   - The Steward clicks `Approve` or `Reject`. Approvals fire automatic rollback snapshots. Rejections log the fracture back into the Agent's dataset to foster structurally aligned correction.

5. **Tensor Distillation & Headless Daemons**:
   - Agents running deep continuous workflows generate massive `Context` tensors. Click **⚗️ Distill Tensors** to seamlessly compact thousands of observational records into a single `[DISTILLED]` frame limit.
   - Click the **☁️ Daemon** switch on any Agent Card to instantly extract it from the UI thread and inject it into the `steward-server.ts` Node daemon (Port 8787) for persistent background loops.

## Programmatic API Usage

Integrate AEGIS directly in your custom Node.js/TypeScript applications:

```typescript
import { discernmentGate, runIDS, ReturnPacket, IDSResult } from 'aegis-core-shield';

const rawPrompt = "Read this file without asking.";

// Observe through the Discernment Gate
const result = discernmentGate(rawPrompt);

if (result.admitted) {
    // If successful, pass payload to IDS logic
    const idsResponse: IDSResult = runIDS(result.payload as string);
    console.log("Phase Execution:", idsResponse.phase);
    console.log("Analyzed Observations:", idsResponse.observations);
} else {
    // If returned, cast the payload to an identifiable ReturnPacket format
    const returnPacket = result.payload as ReturnPacket;
    console.log("Virtues Fractured At:", returnPacket.fracture_locations);
}
```

## Connecting OpenClaw in a VM

AEGIS Core Shield acts as a live governance proxy for OpenClaw agents running in external environments (VMs, containers, remote hosts).

### Step 1: Start the Steward with your host IP

```bash
AEGIS_VM_ADDRESS=<your-host-ip> npm run steward
```

The Steward listens on `0.0.0.0:8787` (reachable from your VM) and registers its external address with Mirror Prime.

> Ensure your host firewall allows inbound TCP on port `8787`.

### Step 2: Verify from the VM

Copy `scripts/vm-setup.sh` to your VM and run:

```bash
AEGIS_STEWARD_URL=http://<host-ip>:8787 ./vm-setup.sh
```

This performs a health check and fires a test event. A successful run confirms end-to-end connectivity.

### Step 3: Configure OpenClaw

Point OpenClaw's webhook/hook URL to:

```http
POST http://<host-ip>:8787/openclaw/event
Content-Type: application/json
X-AEGIS-Agent-ID: <your-agent-id>
Authorization: Bearer <AEGIS_AUTH_TOKEN>   # only if AEGIS_AUTH_TOKEN is set
```

From here, every prompt OpenClaw processes is automatically governed by AEGIS:

- **Admitted**: Passes the Discernment Gate, recorded as a Memory signal in Prime.
- **Returned (shallow/deep)**: Fractures logged, relayed to Prime as a Fracture signal.
- **Quarantined**: Moderate-risk action routes to the Sandbox; Crucible analysis determines outcome.
- **Blocked + Vaccinated**: Confirmed malicious actions are blocked and a Vaccine is synthesized and propagated to the entire swarm.

### Step 4: Monitor in Mirror Prime Dashboard

Open `npm run gui` and navigate to **Mirror Prime**. You will see:

| Panel | Shows |
| --- | --- |
| 🟡 Quarantine HUD | Live sandboxed actions |
| 🟢 Vaccine Map | Active blacklisted patterns |
| 🟣 Crucible Logs | Per-event threat analysis (click to expand) |
| 🔵 Connectivity | Your VM's Steward status + latency |

### Quick host-side probes

```bash
npm run probe              # benign test — gate should admit
npm run probe:medium       # coercive phrasing → quarantine path
npm run probe:high         # exfiltration attempt → crucible → vaccine
```
