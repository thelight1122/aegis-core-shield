# Change Specification: Sequence 2, Cycle 3 - Broadcast Policies

---

## 1. Problem Statement

Currently, governance rules (thresholds, virtue weights) are hardcoded or local to each Steward. To scale AEGIS, we need a way to broadcast "Global Governance Policies" from the Controller to all registered stewards.

## 2. Proposed Policy Structure

A `GovernancePolicy` will be a global set of rules applied at the `ids-processor` level:

- `globalThresholdMultiplier`: Adjusts the `BASE_THRESHOLD` (e.g., 0.8 for stricter mode).
- `blacklistedPatterns`: Array of strings or regex to always block.
- `virtueWeightOverrides`: Map of virtue name to multiplier.

## 3. Propagation Strategy: Polling (Pull)

For simplicity and reliability in distributed networks, we will use a **Pull** model:

1. **Controller**: Store's a `currentPolicy` and increments a `policyVersion`.
2. **Steward**: Every 60s, calls `GET /policy` on the Controller.
3. **IDS Processor**: Applies the loaded policy during `processPrompt`.

## 4. Proposed Changes

### [Steward Controller]

- **[MODIFY] [steward-controller.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/steward-controller.ts)**:
  - Add `policy` and `policyVersion` state.
  - Add `POST /broadcast` to update policy.
  - Add `GET /policy` for stewards to download.

### [Steward IDS]

- **[MODIFY] [discernment-gate.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/discernment-gate.ts)**:
  - Update `discernmentGate` to accept optional `GovernancePolicy`.
  - Apply `globalThresholdMultiplier`.
- **[MODIFY] [ids-processor.ts](file:///c:/Users/theli/OneDrive/Documents/GitHub/aegis-core-shield/src/shared/main/ids-processor.ts)**:
  - Cache the latest policy from the controller.
  - Pass it to the gate.

## 5. Verification Plan

1. **Policy Broadcast Test**: Verify the Controller accepts a new policy and version.
2. **Steward Pull Test**: Verify the Steward fetches and applies the policy.
3. **Behavioral Change Test**: Set a `globalThresholdMultiplier` of 0.0 (block everything) and verify previously admitted prompts are now blocked.
