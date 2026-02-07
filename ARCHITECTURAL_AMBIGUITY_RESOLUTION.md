# ARCHITECTURAL AMBIGUITY RESOLUTION – 2026-02-07

## Resolution of Root Folder Discordance

- **Fracture Observed**: Redundant implementation file `ids.ts` remains in repository root, deviating from the canonical structure established in `src/`.
- **Loyalty Restored**: The canonical entry point for IDS processing is `src/main/ids.ts`, which relays to the implementation in `src/shared/main/ids-processor.ts`.
- **Action**: Root-level `ids.ts` is designated as LEGACY. In accordance with the AEGIS Append-only Axiom, it is preserved rather than deleted. All future developments must reference the `src/` directory tree exclusively.

*This document serves as the structural source of truth for repository organization.*
