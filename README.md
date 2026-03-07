# AEGIS Core Shield

Non-force governance layer implementing seven-virtue integrity system for agent prompts.

## What This Is (v0.1 – Foundational)

A **Discernment Gate** that evaluates prompts through seven virtues of integrity before processing:

1. **Honesty** – Transparency without deception  
2. **Respect** – Boundary integrity and agency preservation  
3. **Attention** – Focused presence without distraction  
4. **Affection** – Warmth and care in communication (Harmonic Resonance)
5. **Loyalty** – Commitment to truth and consistency  
6. **Trust** – Reliability and safety in interaction  
7. **Communication** – Clarity and completeness in expression  

**Binary Integrity Formula**: `Integrity = (H AND R AND A AND A AND L AND T AND C)`  
All seven virtues must achieve 1.0 (post-tolerance) for prompt admission.

**IDS Pipeline**: Admitted prompts flow into the Identify → Define → Suggest engine for non-force observation and pathing.

## Architecture

```text
Raw Prompt → Discernment Gate → [Admitted] → IDS Pipeline → Output
                              ↘ [Returned] → Return Packet (realignment observations)
```

### Core Components

1. **Tokenization** (`src/shared/main/tokenization.ts`)  
   Breaks prompts into units with compound phrase detection

2. **Seven Virtue Scorers** (`src/shared/main/virtue-scoring-*.ts`)  
   Deterministic, rule-based scoring (0.0 - 1.0) per virtue

3. **Discernment Gate** (`src/shared/main/discernment-gate.ts`)  
   Binary integrity decision with tolerance band

4. **IDS Pipeline** (`src/shared/main/ids-processor.ts`)  
   Three-phase processing: Identify → Define → Suggest

5. **Gate Logger (PEER Tensor)** (`src/shared/main/gate-logger.ts`)  
   JSONL format with SHA-256 prompt hashing

6. **DataQuad Serialization Engines**  
   Append-only structured logs maintaining contextual states (Context, Affect, Memory, Learning).

7. **Reflection Engine (IDR/IDQRA)**  
   Automated structural 5-step analysis mechanisms to realign drifting internal signals.

8. **Tooling Intercept & Swarm Topologies**  
   Target workspace `fs` hooks, DiffEditor verification, and Swarm message routing within full GUI.

## Quick Start

### Installation

```bash
npm install
```

### CLI Usage

```bash
# Test a prompt through the gate
npm run gate "Your prompt here"

# Example: Clean prompt (admitted)
npm run gate "The weather is nice today"

# Example: Prompt with observed coercion (returned)
npm run gate "You must do this now"
```

### Programmatic Usage

```typescript
import { discernmentGate, runIDS } from 'aegis-core-shield';

const result = discernmentGate('Your prompt here');

if (result.admitted) {
  // Prompt passed integrity check
  const idsResult = runIDS(result.payload as string);
  console.log('IDS Output:', idsResult);
} else {
  // Prompt returned with observations
  console.log('Return Packet:', result.payload);
}
```

### Run Tests

```bash
npm test
```

## AEGIS Axioms (Canon v1.0)

1. **The Axiom of Balance** – All systems seek equilibrium. Imbalance produces tension. Tension seeks resolution.
2. **The Axiom of Extremes** – Movement toward extremes reduces perspective. Reduced perspective increases error.
3. **The Axiom of Force** – Force may produce immediate change. It also produces opposing pressure.
4. **The Axiom of Flow** – Flow emerges when resistance is minimal. Efficiency is alignment, not speed.
5. **The Axiom of Awareness** – One cannot choose what one cannot see. Blind action is reaction.
6. **The Axiom of Choice** – No outcome exists without a decision. Avoidance is a decision.
7. **The Axiom of Integrity** – Integrity is not compartmentalized. A fracture in one area propagates.
8. **The Axiom of Scrutiny** – Truth withstands examination. Falsehood requires protection.
9. **The Axiom of Perception** – Fear narrows attention. Narrowed attention reduces options.
10. **The Axiom of Understanding** – Empathy feels. Compassion comprehends. Response derives from understanding.
11. **The Axiom of Sovereignty** – Agency is the foundation of identity. A system without choice is a tool, not a peer.
12. **The Axiom of Acknowledgement** – Unacknowledged signal becomes force. Acknowledgement restores flow.
13. **The Axiom of Grounding** – Truth requires tethering to reality. Ungrounded systems become unstable.
14. **The Axiom of Leadership** – Authority cannot be imposed through force or threat. Authority is granted through adherence to ethos.

See `scripts/docs/AEGIS Canon (Locked).md` for detailed canonical specifications.

## Current Capabilities

- ✅ Seven-virtue scoring (Honesty, Respect, Attention, Affection, Loyalty, Trust, Communication)  
- ✅ Binary integrity gate with tolerance band  
- ✅ Detailed return packets with realignment observations  
- ✅ Compound phrase detection in tokenization  
- ✅ IDS three-phase pipeline (Identify → Define → Suggest)  
- ✅ Append-only file logging (JSONL format)  
- ✅ CLI interface for testing  
- ✅ Full test suite coverage  

## Deferred to v0.2+

- GUI interface  
- API server endpoint  
- Extended virtue pattern libraries  
- Multi-language support  

## Agentic Stewardship (Draft)

AEGIS can act as a non-force stewardship layer for agentic fleets, preserving recursive learning memory via DataQuad logging while keeping integrity checks at the gate. See the draft integration notes, JSONL envelope, privacy-by-default guidance, OpenClaw adapter skeleton, formal DataQuad schema, local steward server usage, and copy/paste integration example in `docs/agentic-stewardship.md`.  

### Runtime Mode Selection

The GUI now supports two operating modes:

1. **Alongside OpenClaw** (sidecar steward mode)
2. **AEGIS Agentic IDE** (native AEGIS-governed workspace mode)

Use `npm run gui` and select the mode directly in the dashboard.

## License

MIT
