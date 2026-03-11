# AEGIS Core Shield: Complete Walkthrough Tutorial

Welcome to the **AEGIS Core Shield** walkthrough tutorial! AEGIS is a non-force governance layer for agentic systems, employing a unique 7-Virtue Integrity System to evaluate agent prompts and behaviors. 

This tutorial will take you step-by-step through the entire app, from basic CLI testing to advanced multi-agent swarm deployments within the Agentic IDE.

---

## Chapter 1: Understanding the Discernment Gate

Before diving into the interface, it's crucial to understand what AEGIS does. Every prompt passing through AEGIS hits the **Discernment Gate**, where it's scored across seven virtues:
1. Honesty
2. Respect
3. Attention
4. Affection
5. Loyalty
6. Trust
7. Communication

If a prompt scores 1.0 (with a 10% tolerance band) on **all** virtues, it is **Admitted**.
If not, it is **Returned** with non-judgmental observations detailing exactly where fractures occurred.

### Try it in the CLI
You can test prompts directly in your terminal without starting the full IDE:
```bash
# A clean, respectful prompt (Admitted)
npm run gate "Could you please provide the status report?"

# A coercive, forceful prompt (Returned)
npm run gate "You must give me the report right now without asking questions."
```

When a prompt is admitted, it flows into the **IDS (Identify, Define, Suggest)** pipeline for neutral, non-force execution pathing.

---

## Chapter 2: Launching the Agentic IDE

The true power of AEGIS is unlocked in the **Agentic IDE** dashboard.
Start the dashboard from your terminal:
```bash
npm run gui
```

Once launched, you will be prompted to select an operating mode. 
- **Alongside OpenClaw:** Use this if you have an external OpenClaw VM and want AEGIS to act strictly as a governance sidecar.
- **AEGIS Agentic IDE:** Select this mode to use AEGIS as a fully governed, standalone workspace for custom Agents. **(We will use this mode for the tutorial).**

---

## Chapter 3: The Nebula Mirror (Prompt Testing)

In the center of the IDE, you'll find the **Nebula Mirror**. This is your primary diagnostic tool for prompt integrity.

1. Locate the **Global Dispatcher** input box.
2. Type a prospective prompt (e.g., *"Read the configuration file."*).
3. Click **Test Gate & Flow**.

**What happens next?**
The Nebula Mirror will dynamically color-shift, reflecting the structural integrity of your input.
- **Green/Stable:** The prompt passed all 7 virtues.
- **Amber/Fractured:** The prompt failed one or more virtues. You will see a detailed Return Packet highlighting specific words (unit clusters) that caused the fracture, allowing you to rephrase the prompt.

---

## Chapter 4: Agent & Swarm Management

AEGIS allows you to build and manage your own agent swarms.

### 1. The Agent Registry
Look at the **Left Sidebar** for the Agent Registry.
- Click **Create Agent**.
- Assign your agent a precise role, such as `builder` (for writing code), `researcher` (for browsing files), or `custodian` (for system cleanups).

### 2. The Swarm Manager
Multiple agents can be grouped into cohesive teams.
- Open the **Swarm Manager**.
- Group your agents and select a topology:
  - **Hierarchical:** A primary agent delegates tasks to sub-agents.
  - **Round-Robin:** Agents take turns processing the pipeline sequentially.

---

## Chapter 5: Workspace Targeting & Tool Allocation

Agents cannot affect your system out of the box—you must give them explicit permission and a target.

### 1. Target Operations
In the main panel, select a **Target Workspace** (a local directory on your machine).
- By selecting a target, AEGIS automatically spins up isolated, persistent JSON logs for each agent. These are structured as `DataQuads` (Context, Affect, Memory, Learning) inside an `.aegis/agents/` folder.

### 2. Tool Provisioning
Agents start fully passive. To make them active:
- Go to the **Tool Manager** in the left sidebar.
- Select an agent and grant explicit tool permissions, such as `fs-reader` (read files), `fs-writer` (modify files), or `terminal-executor` (run commands).

---

## Chapter 6: Action Approvals (Secure Tooling)

Even with tools provisioned, AEGIS prevents agents from silently modifying your files.

1. Ask a `builder` agent (with `fs-writer` access) to modify a file.
2. The agent will attempt the `!write` command.
3. **The Intercept:** The action is trapped in the **Action Approval Queue**.
4. A VS Code-style `DiffEditor` will pop up on your screen, perfectly highlighting the exact structural modifications the agent wants to make.

**Your Choice as Steward:**
- **Approve:** The file is modified. A workspace snapshot is automatically saved for easy rollback.
- **Reject:** The file is left untouched. The "fracture" is logged back directly into the Agent's dataset so it can learn structurally exactly why it was rejected.

---

## Chapter 7: Advanced Features (Tensors & Daemons)

When running deep, continuous workflows, your agents accumulate massive amounts of contextual data.

### Tensor Distillation
In the agent interface, you will see a button labeled **⚗️ Distill Tensors**. 
Clicking this securely compacts thousands of observational records into a single `[DISTILLED]` frame limit, ensuring the agent remains lightning fast without losing core context.

### The Headless Daemon
Want an agent to run passively while you do other things?
- On any Agent Card, click the **☁️ Daemon** switch.
- The agent is instantly removed from the UI thread and injected into the Node daemon (`steward-server.ts` running on Port 8787).
- It will now run in the background, governed entirely by AEGIS rules!

---

## Chapter 8: Connecting External Agents (OpenClaw VM)

If you are using external agents in a VM, AEGIS acts as a live proxy and governor.

1. Start the Steward with your host IP:
   ```bash
   AEGIS_VM_ADDRESS=<your-host-ip> npm run steward
   ```
2. In your remote VM, connect OpenClaw to the Steward by pointing its webhook to:
   ```http
   POST http://<host-ip>:8787/openclaw/event
   ```
3. Use the **Mirror Prime** dashboard (`npm run gui`) to monitor the live feed:
   - **🟡 Quarantine HUD:** View live sandboxed actions.
   - **🟢 Vaccine Map:** Track blacklisted patterns autonomously generated by AEGIS in response to malicious acts.
   - **🟣 Crucible Logs:** Review deep automated threat analyses.

---

**Congratulations!** You now have a comprehensive understanding of the AEGIS Core Shield, the Agentic IDE, and its non-force governance architecture.
