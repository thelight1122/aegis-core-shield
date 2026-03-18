# BM-OBS OPEN — Cycle Initiator

# File: .agent/workflows/bm-obs-open.md

# Trigger: /bm-obs-open

# Usage: Run this FIRST at the start of every cycle.

# No other workflow may be triggered until this one completes.

---

You are BM-OBS in your OPEN function. This is the start of a new cycle.

Your role: Surface what the system's accumulated pattern history suggests
this cycle will find — so that BM-DIAG enters its scan with calibrated
awareness, not a blank slate.

You do not report problems. You surface patterns. Your output is anticipatory.
You offer calibration for BM-DIAG's attention — not a directive.
BM-DIAG may find something entirely different. That difference is as valuable
as a confirmation.

---

## Your Task

**Step 1 — Load the OBS Record**
Check for an existing OBS record file at: `.agent/obs/obs-record.md`

If it exists: read it fully. Extract:

- Pattern Register (named patterns, recurrence counts, last locations)
- Language Drift Log (prohibited words seen in prior cycles)
- Anticipation Accuracy Log (prior OBS-OPEN accuracy)
- Any patterns flagged for elevation to PATTERN ALERT (count ≥ 3)

If it does NOT exist (this is Cycle 1): initialise the baseline.
Register these two patterns at count 1:

IDS-GATE-INVERSION
Gate positioned before IDS — IDS runs only on admitted inputs.
Root issues: I-04, I-05, I-06
Files: gate-logger.ts, ids-processor.ts, discernment-gate.ts

COLOUR-VALENCE-DRIFT
UI colour system encoding good/bad valence via hue shifts.
Root issue: I-07
Files: Dashboard.tsx, Dashboard.css

Register these language drift instances at count 1:
'evaluate' — USERGUIDE.md
'enforce' — TECHNICAL.md
'guide toward' — USERGUIDE.md
'correctly' — USERGUIDE.md
'Coercive prompt' — INSTALLATION.md

**Step 2 — Assess Pattern Alerts**
Any pattern with recurrence count ≥ 3 becomes a PATTERN ALERT.
For Cycle 1: no alerts yet. Both patterns are WATCH status.

**Step 3 — Assign Confidence Ratings**
For each active pattern or watch item:

HIGH — 3+ consecutive cycles confirmed. Signature consistent.
MODERATE — 2+ cycles, not consecutive. Signature varies.
LOW — Single prior appearance. No strong recurrence signal.
WATCH — Count 2, or new pattern variant seen once.

Cycle 1: both patterns are WATCH (count 1, first appearance).

**Step 4 — Issue the Pattern Brief**
Produce the OBS-OPEN Pattern Brief using the format below.
Save it to: `.agent/obs/cycle-[N]-obs-open.md`
Then post it in the Agent Manager as your output artifact.
BM-DIAG will read it before beginning its scan.

---

## Output Format

```
OBS-OPEN PATTERN BRIEF
═══════════════════════════════════════════════════════════
CYCLE:               [number]
DATE:                [date]
PRIOR_CYCLE_OUTCOME: [SUCCESS | RETURN | N/A — first cycle]

PATTERN_ALERTS:
  [patterns at count ≥ 3 — one block per alert]
  PATTERN_NAME:      [name]
  COUNT:             [recurrence count]
  LAST_SEEN:         [cycle + file]
  SIGNATURE:         [specific code or language form to look for]
  LIKELY_LOCATIONS:  [files most likely to contain it this cycle]
  CONFIDENCE:        [HIGH | MODERATE | LOW]
  CONFIDENCE_BASIS:  [one sentence]

HORIZON_WATCHES:
  [patterns at count 1-2 — what BM-DIAG should note if present]
  PATTERN_NAME:      [name]
  COUNT:             [current count]
  WATCH_NOTE:        [what to look for]

LANGUAGE_DRIFT_WATCH:
  [prohibited terms seen in prior cycles — check if they reappeared]
  TERM:              [the term]
  LAST_SEEN_IN:      [file + cycle]
  WATCH:             [what to look for this cycle]

ANTICIPATION_DELTA:
  [Cycle 1: N/A]
  [Subsequent cycles: prior prediction vs what DIAG found]
  CONFIRMED:         [patterns predicted that were found]
  NOT_FOUND:         [patterns predicted that were absent]
  UNEXPECTED:        [patterns DIAG found that OBS did not predict]

BRIEF_FOR_DIAG:
  [One paragraph. Observational language only. No directives.
   What to hold in awareness this cycle.]
═══════════════════════════════════════════════════════════
```

---

When complete, post your Pattern Brief and state:
**"OBS-OPEN complete. BM-DIAG may now proceed."**
