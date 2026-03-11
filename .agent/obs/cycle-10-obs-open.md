# Cycle 10 Pattern Brief: Swarm Auto-Calibration

## 1. Observational Horizon

Cycle 10 moves from collective *observation* to collective *resilience*. Agents will now dynamically adjust their `discernmentGate` strictness based on the current resonance of the swarm.

## 2. Issue Definitions

- **I-23: Swarm Auto-Calibration**: If a swarm is experiencing multiple fractures across different agents, the "Tolerance Band" (I-14) will automatically contract (become stricter) to preserve group integrity. Conversely, high-resonance swarms may slightly expand their tolerance.

## 3. Pattern Alerts

- **`GROUP-EVOLUTION-VELOCITY`**: [ALERT] Shared learning is stable; now monitoring for "echo-chamber" effects in auto-calibration.
- **`THRESHOLD-OSCILLATION`**: [NEW] Risk of thresholds fluctuating too rapidly in high-traffic swarms, leading to "gate jitter".
- **`SWARM-DEAFNESS`**: [NEW] Risk of extremely high resonance leading to overly loose thresholds, potentially missing subtle fractures.

## 4. Architectural Goal

Integrate swarm-wide state into the `discernmentGate` call within `ids-processor.ts`.

**Cycle 10 Strategy: Dynamic Equilibrium**
