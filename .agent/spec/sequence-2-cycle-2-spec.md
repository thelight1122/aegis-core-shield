# Change Specification: Sequence 2, Cycle 2 - Global Pressure Aggregation

---

## 1. Problem Statement

Individual AEGIS Stewards currently calculate "Swarm Coherence" based only on their local database state. In a distributed environment, if Swarm A is split across two Stewards, neither has the full picture of the swarm's health. We need a way to aggregate this "pressure" at the Orchestration layer.

## 2. Proposed Logic: Global Resonance Factor (GRF)

The Steward Controller will periodically poll all registered stewards to collect their local `swarmCoherence` metrics and fracture counts. It will then compute a **Global Resonance Factor (GRF)** for each swarm.

1. **Poll**: Controller calls `GET /status` on each steward.
2. **Aggregate**: For each swarm, sum all memories ($M_{total}$) and all affects/fractures ($A_{total}$).
3. **Calculate GRF**: $GRF = M_{total} / (M_{total} + A_{total})$.
4. **Broadcast**: Controller makes the GRF available via a new `/resonance/:swarmId` endpoint.

## 3. Proposed Changes

### [Steward Controller]

- **[MODIFY] [steward-controller.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/steward-controller.ts)**:
  - Implement a background polling loop (every 30s) to update steward metrics.
  - Add a `resonance` store to track GRF per swarm.
  - Add `GET /resonance/:swarmId` endpoint.

### [Steward Ingest]

- **[MODIFY] [openclaw-ingest.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/adapters/openclaw-ingest.ts)**:
  - Update `GET /status` to include detailed resonance metrics (memory count, affect count).

## 4. Verification Plan

1. **Mock Multi-Steward Setup**: Test with two mock stewards reporting different fracture counts for the same swarm.
2. **GRF Calculation Test**: Verify the Controller correctly computes the aggregate ratio.
3. **Isolation Test**: Ensure Swarm A's pressure doesn't leak into Swarm B's GRF.
