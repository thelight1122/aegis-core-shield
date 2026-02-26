// src/renderer/Dashboard.tsx
// Purpose: Main GUI dashboard for AEGIS Core Shield
// Displays prompt input, gate/IDS flow result, and nebula visualization
// Nebula: visual coherence mirror (rings + color shift) – observation only

import React, { useState, ChangeEvent } from 'react';
import { processPrompt } from '../shared/main/ids-processor';
import { ReturnPacket } from '../shared/main/discernment-gate';
import './Dashboard.css';

type AgenticMode = 'openclaw-sidecar' | 'aegis-ide';

interface AegisAgent {
    id: string;
    role: string;
    status: 'idle' | 'active';
    memory: string[];
}

const DEFAULT_AGENTS: AegisAgent[] = [
    {
        id: 'steward-1',
        role: 'Steward Agent',
        status: 'idle',
        memory: ['Integrity baseline initialized'],
    },
    {
        id: 'research-1',
        role: 'Research Agent',
        status: 'idle',
        memory: ['Context channel attached'],
    },
    {
        id: 'builder-1',
        role: 'Builder Agent',
        status: 'idle',
        memory: ['Toolchain profile loaded'],
    },
];

export default function Dashboard() {
    const [mode, setMode] = useState<AgenticMode>('openclaw-sidecar');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<any>(null);
    const [coherence, setCoherence] = useState(0); // 0–1 (Integrity proxy)
    const [fracturedVirtues, setFracturedVirtues] = useState<string[]>([]);
    const [agents, setAgents] = useState<AegisAgent[]>(DEFAULT_AGENTS);

    const handleSubmit = async () => {
        let res: any;
        if (window.aegisAPI) {
            res = await window.aegisAPI.processPrompt(prompt);
        } else {
            // Fallback for dev/non-Electron
            res = processPrompt(prompt);
        }

        setResult(res);

        // Update coherence score & fractures from result
        if (res && 'admitted' in res && res.admitted) {
            setCoherence(1.0);
            setFracturedVirtues([]);
            setAgents((prev) =>
                prev.map((agent) => ({
                    ...agent,
                    status: agent.id === 'steward-1' ? 'active' : 'idle',
                    memory:
                        agent.id === 'steward-1'
                            ? [...agent.memory.slice(-2), `Accepted prompt at ${new Date().toISOString()}`]
                            : agent.memory,
                }))
            );
        } else if (res && 'status' in res && res.status === 'discernment_gate_return') {
            const packet = res as ReturnPacket;
            const scores = Object.values(packet.observed_alignment).map((v) => v.score);
            const minScore = scores.length > 0 ? Math.min(...scores) : 0;
            setCoherence(minScore);

            const fractured = Object.entries(packet.observed_alignment)
                .filter(([_, v]) => v.score < 1)
                .map(([virtue]) => virtue);
            setFracturedVirtues(fractured);

            setAgents((prev) =>
                prev.map((agent) => ({
                    ...agent,
                    status: agent.id === 'steward-1' ? 'active' : 'idle',
                    memory:
                        agent.id === 'steward-1'
                            ? [...agent.memory.slice(-2), `Returned prompt for realignment at ${new Date().toISOString()}`]
                            : agent.memory,
                }))
            );
        } else {
            setCoherence(0);
            setFracturedVirtues([]);
        }
    };

    const isHighCoherence = coherence > 0.8;
    const ringColor = isHighCoherence ? '#58a6ff' : '#f78166';

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">AEGIS Core Shield</h1>
            <p>Choose runtime mode: run alongside OpenClaw or in AEGIS Agentic IDE mode.</p>

            <div className="mode-toggle">
                <button
                    className={`mode-button ${mode === 'openclaw-sidecar' ? 'active' : ''}`}
                    onClick={() => setMode('openclaw-sidecar')}
                >
                    1. Alongside OpenClaw
                </button>
                <button
                    className={`mode-button ${mode === 'aegis-ide' ? 'active' : ''}`}
                    onClick={() => setMode('aegis-ide')}
                >
                    2. AEGIS Agentic IDE
                </button>
            </div>

            {mode === 'openclaw-sidecar' ? (
                <div className="mode-panel">
                    <h2>OpenClaw Sidecar Steward</h2>
                    <p>
                        Use AEGIS as a governance sidecar. Ingest OpenClaw events through the local steward API and
                        preserve append-only DataQuad memory.
                    </p>
                    <code>POST /openclaw/event • GET /health • npm run steward</code>
                </div>
            ) : (
                <div className="mode-panel">
                    <h2>AEGIS Agentic IDE</h2>
                    <p>
                        Run a native AEGIS-managed workspace with steward, research, and builder agents operating under
                        the discernment gate.
                    </p>
                    <div className="agent-grid">
                        {agents.map((agent) => (
                            <div key={agent.id} className="agent-card">
                                <div className="agent-header">
                                    <strong>{agent.role}</strong>
                                    <span className={`agent-status ${agent.status}`}>{agent.status}</span>
                                </div>
                                <div className="agent-id">{agent.id}</div>
                                <ul>
                                    {agent.memory.slice(-2).map((item, idx) => (
                                        <li key={`${agent.id}-${idx}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nebula Visualization – coherence mirror */}
            <div className="nebula-container">
                <div
                    className="nebula-outer-ring"
                    style={{
                        border: `3px solid ${ringColor}`,
                        opacity: 0.6 + coherence * 0.4,
                        animation: `pulse ${3 - coherence * 2}s infinite ease-in-out`,
                    }}
                />

                <div
                    className="nebula-middle-ring"
                    style={{
                        border: `2px dashed ${fracturedVirtues.length === 0 ? '#2ea043' : '#f78166'}`,
                    }}
                />

                <div
                    className="nebula-core-glow"
                    style={{
                        background: `radial-gradient(circle, ${ringColor}, transparent)`,
                        opacity: 0.5 + coherence * 0.5,
                    }}
                />

                {fracturedVirtues.map((v, i) => (
                    <div
                        key={v}
                        className="fracture-indicator"
                        style={{
                            top: `${20 + i * 15}%`,
                            left: '10%',
                        }}
                        title={v}
                    />
                ))}
            </div>

            <textarea
                className="prompt-textarea"
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                placeholder="Enter prompt to test gate..."
                rows={4}
            />

            <button className="test-button" onClick={handleSubmit}>
                Test Gate & Flow
            </button>

            {result && <pre className="result-output">{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
}
