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

5. **Append-Only Logger** (`src/shared/main/gate-logger.ts`)  
   JSONL format with SHA-256 prompt hashing

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

# Example: Coercive prompt (returned)
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

## AEGIS Axioms

1. **Append-Only Reality** – Logs never deleted, only appended  
2. **Default Allow** – Gate admits silently when Integrity = 1  
3. **Observation-Only** – No judgment language, only observations  
4. **Binary Integrity** – All-or-nothing (no partial integrity)  
5. **Weakest Link** – Per-virtue minimum across all units  
6. **Non-Force Posture** – Suggestions, not directives  
7. **Seven Virtues** – Complete evaluation across all dimensions  

See `docs/axioms-technical.md` for detailed implementation specifications.

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

## License

MIT
