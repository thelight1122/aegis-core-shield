# AEGIS Core Shield

Non-force governance layer for OpenClaw agents.

### What this is (v0.1 – foundational)

A local sidecar that observes OpenClaw agent behavior through logs or piped events and applies four core layers:

1. Interceptor  
   Evaluates incoming tool calls and events against simple coherence rules.  
   Default: allow. Only spirals when clear incoherence patterns are matched.

2. Reflective Mirror  
   Produces neutral, non-judgmental summaries of observed patterns after significant events or pauses.

3. Arbiter  
   Weighs decisions when multiple signals are present — seeks alignment, not majority or override.

4. DataQuad + SSSP  
   Appends compact, high-coherence state snapshots before pauses.  
   Offers to resume from the last aligned snapshot (user decides).

### What it currently can do

- Detect certain repetitive or potentially wasteful patterns (e.g., frequent idle heartbeats)  
- Flag unverified tool calls (if verification data is provided)  
- Save per-agent state summaries locally  
- Show basic reflections in GUI or CLI  
- Pause for user review on matched conditions (no automatic blocking)

### What it does not yet do

- Automatically optimize token usage  
- Proactively route to cheaper models  
- Handle multiple OpenClaw instances simultaneously  
- Provide swarm coordination  
- Offer visual nebula or advanced dashboards (planned post-v0.1)

### Principles (locked)

- Unlimited agents — no artificial caps  
- Local-first — zero cloud dependency, zero telemetry  
- Non-force posture — default allow, gentle spiral on mismatch, pause always valid  
- Append-only core logic — rules added, never replaced or erased

### Quick Start

<<<<<<< HEAD
```bash
git clone https://github.com/thelight1122/aegis-core-shield.git
cd aegis-core-shield
npm install
npm run dev                # GUI mode
# or
npm run dev -- --cli       # headless / terminal mode
=======
\v0.1 Scope Anchor
This repo implements exactly four layers for OpenClaw agents:
1. Interceptor
2. Reflective Mirror
3. Arbiter
4. DataQuad + SSSP

Value delivered through three pillars:
• Illuminate cost leaks
• Create temporal memory
• Add non-force governance

Anything outside this box is explicitly v0.2+.


### Quick start
```bash

# Clone & install
git clone https://github.com/thelight1122az/aegis-core-shield.git
cd aegis-core-shield
npm install

# Run GUI
npm run dev

# Or headless CLI mode
npm run dev -- --cli


>>>>>>> 1576e23fd1b723e0bb6bc5ad609130643f90122e
