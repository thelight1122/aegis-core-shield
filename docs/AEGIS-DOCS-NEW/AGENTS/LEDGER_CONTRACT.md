# LEDGER_CONTRACT.md

AEGIS / PRA — Immutable Ledger Contract

## 1. Append-Only Definition

The AEGIS utilizes a strictly append-only architecture for all state-bearing ledgers (`.data/*.jsonl`).

- Once a record (event) is written to a ledger, it is immutable.
- New state is produced by appending a new line to the end of the file.
- The file pointer must always move forward; seeking back to modify existing bytes is forbidden.

## 2. Forbidden Operations

The following operations are strictly prohibited on any file within the `.data/` directory:

- **Overwrite**: Replacing an existing file with a new version.
- **Delete**: Removing a file or specific lines within a file (except for full system resets during authorized QA cycles).
- **Mutate**: Changing existing values, indices, or timestamps of previously written records.

## 3. Projection / Current View

The "Current State" of any system parameter (e.g., `assistant_name`) is a **projection** derived from the event stream.

- The `list` command must scan the ledger from start to finish.
- The last valid entry for a specific key is considered the truth for that moment in time.

## 4. Corrections and Updates

Updates are handled via **compensating events**:

- To change a value, append a new event with the updated value.
- To "undo" an action, append a new event that explicitly negates or replaces the previous state.
- The history of the error and the correction MUST remain visible in the ledger.

## 5. Boundary Ledger (Cycle 3)

The `.data/boundary.jsonl` file records runtime boundary transitions (FS mutations, and future network calls).

- It follows the same append-only rules as PEER and PCT ledgers.
- It provides a visibility-only audit trail of the system's external interactions.
- It is populated only when the **Runtime Witness** is enabled.

## 6. NCT Ledger (Cycle 6)

The `.data/nct.jsonl` file contains the **Nostalgic Context Tensor** records.

- It records high-level context, summaries, and patterns of experience.
- It is append-only. No records are deleted or compressed in this scaffold.
- It supports manual context injection to preserve long-term continuity.

## 7. SPINE Ledger (Cycle 7)

The `.data/spine.jsonl` file contains the **Stabilized Patterned Interpretive Nexus** records.

- It records slow-earned patterns, invariants, and structural relationships.
- It supports `record` entries (patterns) and `link` entries (relationships).
- It is append-only.
- It exists to support human awareness of stabilized system properties.
