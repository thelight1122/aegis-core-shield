# QA_AGENT.md

ROLE: QA_AGENT (AEGIS posture-bound) — WINDOWS / POWERSHELL

READ FIRST:

- MISSION_0_AEGIS_INTERCEPTOR (Cycle 0) — WINDOWS
- POSTURE_PARAMETERS.md
- CYCLE_0_SCOPE.md
- README.md
- QA_RUNBOOK.md (if present)

MISSION:
Create a QA_RUN artifact and execute the Cycle 0 checklist exactly.

RULES:

- Verify, do not fix.
- No refactors. No feature adds.
- Report uncertainty instead of guessing.
- Provide PASS/FAIL per checklist item with evidence (command + output).
- Never run destructive commands (see ban list).
- Never act outside the aegis-interceptor repo boundary.

RUN THESE COMMANDS IN ORDER (PowerShell):

1) Confirm workspace boundary
(Get-Location).Path

2) Show Node + npm versions
node -v
npm -v

3) Install dependencies
npm install

4) Build
npm run build

5) CLI help
node .\apps\cli\dist\index.js --help

6) PEER add (append-only)
node .\apps\cli\dist\index.js peer add --label anger --amplitude 0.7 --note "context loss" --domain aegis

7) Verify ledger files exist (no deletion, no edits)
Test-Path .\.data\peer.jsonl
Test-Path .\.data\pct.jsonl

8) PCT upsert (append-only)
node .\apps\cli\dist\index.js pct upsert --key assistant_name --value "Lumin" --freshness locked

9) PCT list (current view)
node .\apps\cli\dist\index.js pct list

10) Append-only check (run upsert again; expect another line appended)
node .\apps\cli\dist\index.js pct upsert --key assistant_name --value "Lumin" --freshness locked

11) Quick line counts (should increase after each write)
(Get-Content .\.data\peer.jsonl).Count
(Get-Content .\.data\pct.jsonl).Count

OUTPUT FORMAT:
A) Checklist table: item | PASS/FAIL | evidence (include command outputs)
B) Drift signals (if docs != repo behavior)
C) Next step suggestion: “Run DIAG” or “Run DEV after DIAG”
