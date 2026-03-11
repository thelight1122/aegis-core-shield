# AEGIS BM Agent System — Antigravity Setup Guide

## What This Package Contains

```
aegis-bm-rules.md                    → .agent/rules/
bm-obs-open.md                       → .agent/workflows/
bm-diag.md                           → .agent/workflows/
bm-dev.md                            → .agent/workflows/
bm-qa.md                             → .agent/workflows/
bm-arch.md                           → .agent/workflows/
bm-sec.md                            → .agent/workflows/
bm-obs-close.md                      → .agent/workflows/
aegis-issue-manifest-SKILL.md        → .agent/skills/aegis-issue-manifest/SKILL.md
```

---

## Step 1 — Open Your Workspace

Open the `aegis-core-shield` project folder in Antigravity.

---

## Step 2 — Create the Directory Structure

In your project root, create these folders:

```
.agent/
  rules/
  workflows/
  skills/
    aegis-issue-manifest/
  obs/
  diag/
  dev/
  qa/
  arch/
  sec/
```

The `obs/`, `diag/`, `dev/`, `qa/`, `arch/`, `sec/` folders are where
agents save their output packets each cycle. They start empty.

---

## Step 3 — Install the Files

Copy files to these exact locations:

| File                          | Destination                                 |
| ----------------------------- | ------------------------------------------- |
| aegis-bm-rules.md             | .agent/rules/aegis-bm-rules.md              |
| bm-obs-open.md                | .agent/workflows/bm-obs-open.md             |
| bm-diag.md                    | .agent/workflows/bm-diag.md                 |
| bm-dev.md                     | .agent/workflows/bm-dev.md                  |
| bm-qa.md                      | .agent/workflows/bm-qa.md                   |
| bm-arch.md                    | .agent/workflows/bm-arch.md                 |
| bm-sec.md                     | .agent/workflows/bm-sec.md                  |
| bm-obs-close.md               | .agent/workflows/bm-obs-close.md            |
| aegis-issue-manifest-SKILL.md | .agent/skills/aegis-issue-manifest/SKILL.md |

---

## Step 4 — Verify the Rules File is Active

In Antigravity: Editor → `...` → Customizations → Rules

You should see `aegis-bm-rules` listed under Workspace rules.
If it is not listed, click `+ Workspace` and add it manually.

The Rules file is always-on. Every agent in every conversation
in this workspace will have the canonical constraints active.

---

## Step 5 — Verify Workflows are Available

In Antigravity: Editor → `...` → Customizations → Workflows

You should see all seven BM workflows listed:

- bm-obs-open
- bm-diag
- bm-dev
- bm-qa
- bm-arch
- bm-sec
- bm-obs-close

If any are missing, add them via `+ Workspace`.

---

## Step 6 — Set Your Model

The BM system is tested with Claude Sonnet 4.6 (available in Antigravity).
You may also use Gemini 3 Pro. Either is suitable.

For BM-ARCH and BM-SEC running in parallel: you can assign different
models to each Agent Manager stream if you wish — they operate independently.

---

## Step 7 — Set Terminal Policy

For Cycle 1, set Terminal Execution to **Review-driven development**.
BM-DEV will write and modify files. You want to review terminal commands
before they execute — especially `npm test` runs.

---

## Running Cycle 1

**Trigger order — do not skip steps:**

1. In Agent Manager chat: type `/bm-obs-open` → Enter
   Wait for: "OBS-OPEN complete. BM-DIAG may now proceed."

2. Type `/bm-diag` → Enter
   Wait for: "BM-DIAG complete. Change Specification saved. BM-DEV may now proceed."

3. Type `/bm-dev` → Enter
   Wait for: "BM-DEV complete. Handoff Packet saved. BM-QA may now proceed."

4. Type `/bm-qa` → Enter
   - If SUCCESS: "BM-QA SUCCESS. Spawn BM-ARCH and BM-SEC in parallel via Agent Manager."
   - If RETURN: route back to `/bm-diag` with the failed issue IDs only

5. On QA SUCCESS — spawn two agents in parallel in Agent Manager:
   Agent stream 1: `/bm-arch`
   Agent stream 2: `/bm-sec`
   Wait for both to post PASS.

6. When both ARCH and SEC are PASS: type `/bm-obs-close` → Enter
   Wait for: "OBS-CLOSE complete. Cycle 1 closed. OBS record updated."

---

## Cycle 1 Success Definition

All of the following must be confirmed:

- [ ] OBS-OPEN Pattern Brief issued (cycle-1-obs-open.md exists)
- [ ] BM-QA SUCCESS: all 8 issues verified, npm test passes, smoke tests pass
- [ ] BM-ARCH PASS: pipeline coherence, composition, boundary checks clean
- [ ] BM-SEC PASS: both technical security and governance integrity passes clean
- [ ] OBS-CLOSE record updated (obs-record.md updated, cycle-1-obs-close.md exists)
