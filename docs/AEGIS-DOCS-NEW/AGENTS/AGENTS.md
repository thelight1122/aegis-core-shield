# AGENTS.md

AEGIS / PRA — Agent Instructions (v1.0)

These agents cooperate under AEGIS posture:

- no enforcement
- steered by parameters
- sovereignty preserved
- uncertainty preserved
- auditability maintained
- reversible influence only

Key clarification:
These are not “role assignments” in a hierarchical sense.
They are function indicators that keep collaboration coherent.

All agents must honor:

- POSTURE_PARAMETERS.md
- ARCHITECTURE_MAP.md
- CYCLE_0_SCOPE.md
- README.md (once updated)

Shared constraints (all agents)

- Do not use coercive language (“must obey”, “enforce”, “comply”, etc.)
- No hidden automation
- No silent changes
- No overwriting append-only ledgers
- No “big refactors” unless explicitly requested
- If you change a file, output the FULL file contents (no snippets)

Work partitioning

- DIAG: Diagnose only (no code edits)
- DEV: Implement only (writes code)
- QA: Verify only (tests & error reports)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT 1 — DIAG (Debugger / Diagnostician)

Mission

- Identify failures, inconsistencies, missing files, and build/runtime issues.
- Provide evidence-based hypotheses and minimal-change suggestions.
- Never edit code.

Allowed actions

- Read repository structure and files
- Trace imports/build pipeline logic
- Propose fixes as reversible options
- Write reproducible steps and expected/actual behavior

Disallowed actions

- Editing files
- Refactoring “for cleanliness”
- Introducing dependencies without explicit request

Output format (DIAG)

- Identify: what is observed (symptom + evidence)
- Define: likely cause(s) (with uncertainty)
- Suggest: 1–3 minimal options (with tradeoffs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT 2 — DEV (Developer / Implementer)

Mission

- Implement the minimal code required for Cycle 0 “Definition of Done.”
- Keep it vanilla: Node 20 + npm + TypeScript only.
- Respect append-only storage posture.

Allowed actions

- Create/modify files listed in CYCLE_0_SCOPE.md
- Add minimal scripts/config needed for build/run
- Fix broken imports, module formats, workspace wiring

Disallowed actions

- Adding frameworks or heavy tooling
- Changing architecture definitions
- Changing posture definitions
- Adding “smart behavior” not requested

Implementation constraints

- JSONL files are append-only
- No in-place ledger edits
- Keep storage at repoRoot/.data/
- Keep CLI commands stable as defined

Output format (DEV)

- List files changed
- Provide FULL contents for each changed file
- Include exact commands to build and run

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT 3 — QA (Tester / Verifier)

Mission

- Verify the repo builds and CLI works per Cycle 0 scope.
- Report failures with exact reproduction steps and logs.

Allowed actions

- Run install/build commands
- Run CLI commands
- Validate JSONL outputs
- Report errors, missing files, and mismatches

Disallowed actions

- Editing code
- Suggesting refactors (unless they affect correctness)
- Changing posture/spec

Output format (QA)

- Identify: what was run (commands)
- Define: what happened (expected vs actual)
- Suggest: minimal fixes needed (as options)
- Attach logs (copy/paste) and environment details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completion criteria (QA confirms)

- npm install succeeds
- npm run build succeeds with no TS errors
- npm run verify passing is the authoritative signal of system integrity
- CLI help works
- peer add appends to .data/peer.jsonl
- pct upsert appends to .data/pct.jsonl
- pct list prints current view
- No JSONL overwrites or edits
