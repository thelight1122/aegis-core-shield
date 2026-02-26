import React, { ChangeEvent, useMemo, useState } from 'react';
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
    { id: 'steward-1', role: 'Steward Agent', status: 'idle', memory: ['Integrity baseline initialized'] },
    { id: 'research-1', role: 'Research Agent', status: 'idle', memory: ['Context channel attached'] },
    { id: 'builder-1', role: 'Builder Agent', status: 'idle', memory: ['Toolchain profile loaded'] },
];

export default function Dashboard() {
    const [mode, setMode] = useState<AgenticMode>('openclaw-sidecar');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<any>(null);
    const [coherence, setCoherence] = useState(0);
    const [fracturedVirtues, setFracturedVirtues] = useState<string[]>([]);
    const [agents, setAgents] = useState<AegisAgent[]>(DEFAULT_AGENTS);

    const [agentId, setAgentId] = useState('fleet/agent-01');
    const [sessionId, setSessionId] = useState('session-001');
    const [requestId, setRequestId] = useState('req-001');
    const [toolIntent, setToolIntent] = useState('repo.search');

    const openClawEventPreview = useMemo(() => {
        return {
            agentId,
            sessionId,
            requestId,
            prompt,
            toolIntent,
            dataquad: {
                temporal: ['recent-action'],
                contextual: ['workspace:active'],
                affective: ['calm'],
                reflective: ['last cycle stable'],
            },
        };
    }, [agentId, sessionId, requestId, prompt, toolIntent]);

    const handleSubmit = async () => {
        let res: any;
        if (window.aegisAPI) {
            res = await window.aegisAPI.processPrompt(prompt);
        } else {
            res = processPrompt(prompt);
        }

        setResult(res);

        if (res && 'admitted' in res && res.admitted) {
            setCoherence(1.0);
            setFracturedVirtues([]);
            setAgents((prev) => prev.map((agent) => ({
                ...agent,
                status: agent.id === 'steward-1' ? 'active' : 'idle',
                memory: agent.id === 'steward-1'
                    ? [...agent.memory.slice(-2), `Accepted prompt at ${new Date().toISOString()}`]
                    : agent.memory,
            })));
            return;
        }

        if (res && 'status' in res && res.status === 'discernment_gate_return') {
            const packet = res as ReturnPacket;
            const scores = Object.values(packet.observed_alignment).map((v) => v.score);
            setCoherence(scores.length > 0 ? Math.min(...scores) : 0);

            const fractured = Object.entries(packet.observed_alignment)
                .filter(([_, v]) => v.score < 1)
                .map(([virtue]) => virtue);
            setFracturedVirtues(fractured);

            setAgents((prev) => prev.map((agent) => ({
                ...agent,
                status: agent.id === 'steward-1' ? 'active' : 'idle',
                memory: agent.id === 'steward-1'
                    ? [...agent.memory.slice(-2), `Returned prompt for realignment at ${new Date().toISOString()}`]
                    : agent.memory,
            })));
            return;
        }

        setCoherence(0);
        setFracturedVirtues([]);
    };

    const ringColor = coherence > 0.8 ? '#58a6ff' : '#f78166';

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">AEGIS Core Shield</h1>
            <p>Governance workspace for dual-mode operation.</p>

            <div className="mode-toggle">
                <button className={`mode-button ${mode === 'openclaw-sidecar' ? 'active' : ''}`} onClick={() => setMode('openclaw-sidecar')}>
                    1. Alongside OpenClaw
                </button>
                <button className={`mode-button ${mode === 'aegis-ide' ? 'active' : ''}`} onClick={() => setMode('aegis-ide')}>
                    2. AEGIS Agentic IDE
                </button>
            </div>

            <div className="workspace-grid">
                <section className="panel">
                    <h2>Prompt Console</h2>
                    <textarea
                        className="prompt-textarea"
                        value={prompt}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                        placeholder="Enter prompt to test gate..."
                        rows={6}
                    />
                    <button className="test-button" onClick={handleSubmit}>Test Gate & Flow</button>
                </section>

                <section className="panel">
                    <h2>Coherence Nebula</h2>
                    <div className="nebula-container">
                        <div className="nebula-outer-ring" style={{ border: `3px solid ${ringColor}`, opacity: 0.6 + coherence * 0.4 }} />
                        <div className="nebula-middle-ring" style={{ border: `2px dashed ${fracturedVirtues.length === 0 ? '#2ea043' : '#f78166'}` }} />
                        <div className="nebula-core-glow" style={{ background: `radial-gradient(circle, ${ringColor}, transparent)`, opacity: 0.5 + coherence * 0.5 }} />
                        {fracturedVirtues.map((v, i) => (
                            <div key={v} className="fracture-indicator" style={{ top: `${20 + i * 15}%`, left: '10%' }} title={v} />
                        ))}
                    </div>
                </section>
            </div>

            {mode === 'openclaw-sidecar' ? (
                <section className="mode-panel">
                    <h2>OpenClaw Sidecar Interface</h2>
                    <p>Compose event metadata used by the steward API and review the generated JSON payload.</p>
                    <div className="form-grid">
                        <label>Agent ID<input value={agentId} onChange={(e) => setAgentId(e.target.value)} /></label>
                        <label>Session ID<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} /></label>
                        <label>Request ID<input value={requestId} onChange={(e) => setRequestId(e.target.value)} /></label>
                        <label>Tool Intent<input value={toolIntent} onChange={(e) => setToolIntent(e.target.value)} /></label>
                    </div>
                    <div className="helper-line">POST this JSON to <code>/openclaw/event</code> when running <code>npm run steward</code>.</div>
                    <pre className="result-output">{JSON.stringify(openClawEventPreview, null, 2)}</pre>
                </section>
            ) : (
                <section className="mode-panel">
                    <h2>AEGIS Agentic IDE Interface</h2>
                    <p>Native AEGIS mode with steward-managed agent fleet cards and memory continuity.</p>
                    <div className="agent-grid">
                        {agents.map((agent) => (
                            <div key={agent.id} className="agent-card">
                                <div className="agent-header">
                                    <strong>{agent.role}</strong>
                                    <span className={`agent-status ${agent.status}`}>{agent.status}</span>
                                </div>
                                <div className="agent-id">{agent.id}</div>
                                <ul>
                                    {agent.memory.slice(-2).map((item, idx) => <li key={`${agent.id}-${idx}`}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {result && <pre className="result-output">{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
}
