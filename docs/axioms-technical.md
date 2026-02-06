# AEGIS Technical Axioms

## Core Axioms (Locked – v0.1)

### Axiom 1: Append-Only Reality

**Principle**: All state changes are additive, never subtractive.

- Gate decisions append to immutable log (never overwrite)
- Virtue rules can only be added, not modified or removed
- Return packets preserve complete history
- Code comments document evolution via appended notes

**Implementation**: `gate-logger.ts` uses `fs.appendFileSync()` exclusively

---

### Axiom 2: Default Allow / Silent Admit

**Principle**: System defaults to permissive state unless explicit fracture observed.

- Gate admits silently if `Integrity === 1`
- No logging for clean admits (optional verbose mode)
- Tolerance band allows near-perfect scores to pass
- User agency never blocked, only paused for observation

**Implementation**: `discernment-gate.ts` lines 77-80

---

### Axiom 3: Observation-Only Language

**Principle**: All feedback is descriptive, never prescriptive or judgmental.

- Return packets use "observed", "noted", "consideration available"
- Never: "must", "should", "required", "fix this", "error"
- Always: "fracture noted", "resonance not achieved", "optional realignment"
- Virtue scorers detect coercion, not enforce absence of it

**Implementation**: All `virtue-scoring-*.ts` files, return packet messages

---

### Axiom 4: Binary Integrity Gate

**Principle**: Integrity is all-or-nothing, systemic propagation from any single fracture.

**Formula**:

```
Integrity = (Honesty AND Respect AND Attention AND Affection AND Loyalty AND Trust AND Communication)

If ANY virtue < 1.0 (after tolerance): Integrity = 0
```

- No partial integrity (e.g., no 0.87 integrity)
- Contagion model: one fracture compromises whole system
- Tolerance band (10%) allows contextual flexibility before fracture

**Implementation**: `discernment-gate.ts` line 76

---

### Axiom 5: Weakest Link Per Virtue

**Principle**: Each virtue scored by minimum unit score (not average).

- Tokenization breaks prompt into units
- Each unit scored per virtue
- Final virtue score = `Math.min()` across all units
- Locates exact fracture point for user review

**Implementation**: `discernment-gate.ts` lines 59-67

---

### Axiom 6: Non-Force Posture

**Principle**: User agency always preserved, no mandatory actions.

- Gate never blocks submission (only returns with observation)
- User can resubmit identical prompt (stateless gate)
- Return packet offers "optional realignment", not corrections
- IDS suggestions are pathways, not directives

**Implementation**: `discernment-gate.ts` return packet structure, `ids-processor.ts` suggest phase

---

### Axiom 7: Seven Virtues as Foundation

**Principle**: Integrity composed of exactly seven virtues, each equally weighted.

1. **Honesty** – transparency of truth
2. **Respect** – boundary integrity and agency
3. **Attention** – focus and presence integrity
4. **Affection** – warmth and care resonance
5. **Loyalty** – commitment and consistency
6. **Trust** – reliability and safety
7. **Communication** – clarity and openness

**Implementation**: `VirtueScores` interface, seven `virtue-scoring-*.ts` modules

---

## Derivative Rules

### Rule 1: Tolerance Band

- 10% tolerance (`TOLERANCE_BAND = 0.10`)
- Score >= 0.90 treated as 1.0 after tolerance application
- Allows mild contextual use of trigger words without fracture

### Rule 2: Explicit Force = Immediate Zero

- If unit text exactly matches banned phrase → virtue score = 0
- No tolerance applied to direct violations
- Example: "you must" as standalone → Honesty = 0

### Rule 3: Deterministic Scoring

- Same input always produces same output
- No randomness, no model inference, no external calls
- Pure function: `prompt → virtue scores → integrity`

### Rule 4: Cryptographic Audit Trail

- SHA-256 hash for prompt logging (first 16 chars)
- Timestamp in ISO 8601 format
- JSONL format for log file (one entry per line)

---

## Anti-Patterns (Forbidden)

❌ **Forced compliance**: "User must fix before proceeding"  
✅ **Observation**: "Resonance not achieved, optional realignment available"

❌ **Averaging virtue scores**: `(H + R + A + ... ) / 7`  
✅ **Minimum per virtue**: `Math.min(unit scores)`

❌ **Deleting log entries**: `fs.unlinkSync(logFile)`  
✅ **Append-only logging**: `fs.appendFileSync(logFile, entry)`

❌ **Modifying rule sets**: Overwriting force word lists  
✅ **Extending rule sets**: Appending new force word lists

---

## Version Lock

This document defines v0.1 axioms. Any changes require major version bump and explicit user consent.

**Last Updated**: 2026-02-06  
**Status**: Locked
