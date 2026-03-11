# AEGIS Core Shield - Description

AEGIS Core Shield is a non-force governance layer designed primarily for OpenClaw agents and autonomous AI systems. It introduces a **Discernment Gate (Prism)** coupled with a **Virtue Integrity System**, fundamentally shifting signal evaluation from subjective rule sets to deterministic, integrity-based structural observations.

## Core Philosophy: The Seven Virtues

At the heart of AEGIS is the evaluation of signals (prompts, interactions) across seven virtues of integrity:

1. **Honesty:** Transparency without deception or manipulation.
2. **Respect:** Maintenance of boundary integrity and preservation of agency.
3. **Attention:** Focused presence without distraction.
4. **Affection:** Warmth and care in communication (Harmonic Resonance).
5. **Loyalty:** Commitment to truth and consistency.
6. **Trust:** Reliability and safety in interaction.
7. **Communication:** Clarity and completeness in expression.

## The Discernment Gate

Before a prompt is processed by the agent system, it must pass through the Discernment Gate. AEGIS employs a **Binary Integrity Formula**:

`Integrity = (Honesty AND Respect AND Attention AND Affection AND Loyalty AND Trust AND Communication)`

All seven virtues are scored on a scale from 0.0 to 1.0. A configurable tolerance band (typically 10%) is applied, meaning scores of 0.90 or higher are treated as 1.0. If all seven virtues achieve a post-tolerance score of 1.0, the prompt is **admitted** silently, ensuring a "default allow" posture.

If any virtue falls below the threshold, the prompt is **returned** (not rejected) with a detailed "Return Packet" containing non-judgmental observations about the structural fractures and suggestions for realignment.

## The IDS Pipeline

Admitted prompts automatically flow into the three-phase **IDS (Identify, Define, Suggest)** pipeline:

1. **Identify:** Detects and observes key elements, intent signals (e.g., imperative vs. descriptive), and entities without interpreting them.
2. **Define:** Structures the observations, outlining sentence composition and context (e.g., entity-centric inquiry, directive proposal).
3. **Suggest:** Offers optional execution pathways based on the observations, strictly maintaining a non-force posture (suggestions over directives).

## Agentic Stewardship and OpenClaw Integration

AEGIS operates in two main modes:

- **Alongside OpenClaw (Sidecar Mode):** Acts as a governance sidecar that ingests OpenClaw events, logs them using the DataQuad schema, and establishes an append-only memory of agent actions.
- **AEGIS Agentic IDE (Full Deployment Center):** A governed workspace where Custom, Research, and Builder agents operate transparently under the Discernment Gate.

### Advanced IDE Capabilities

The AEGIS Agentic IDE has evolved into a robust deployment center:

- **Swarm Topologies:** Assemble agents into cooperative Swarms (Round-Robin or Hierarchical) to tackle deep structural requests.
- **DataQuad Persistence:** Agent states (Context, Affect, Memory, Learning) are securely serialized to JSON inside the Target Workspace.
- **Reflection Engines (IDR & IDQRA):** Fractures in alignment automatically trigger structurally guided reflection sequences to gracefully realign the agent without coercion.
- **Dynamic Tool Provisioning:** Agents can be assigned specific tools (`fs-reader`, `fs-writer`, `terminal-executor`). Destructive acts like file modifications require Steward approval through an Action Intercept UI.
- **Tensor Distillation & Snapshotting:** Context size is managed by distilling deep tensors, and all `write` operations trigger an automatic workspace snapshot allowing zero-friction Rollbacks.
- **Headless Daemon:** The IDE exposes a `deploy` bridge allowing active agent logic to run autonomously in the background daemon (Port 8787).

In both modes, AEGIS strictly adheres to its axioms: append-only reality, non-force posture, weakest-link scoring, and default allow for aligned inputs.
