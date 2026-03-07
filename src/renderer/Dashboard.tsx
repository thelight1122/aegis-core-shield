import React, { useState } from 'react';
import MirrorPrimeDashboard from './components/MirrorPrimeDashboard';
import OpenClawSidecar from './components/OpenClawSidecar';
import AgenticIDE from './components/AgenticIDE';

export type AgenticMode = 'openclaw-sidecar' | 'aegis-ide' | 'mirror-prime';

export default function Dashboard() {
    const [mode, setMode] = useState<AgenticMode>('openclaw-sidecar');

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">AEGIS Core Shield</h1>
            <p>Choose runtime mode: run alongside OpenClaw, use the AEGIS IDE, or monitor the swarm via Mirror Prime.</p>

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
                <button
                    className={`mode-button ${mode === 'mirror-prime' ? 'active' : ''}`}
                    onClick={() => setMode('mirror-prime')}
                >
                    3. Mirror Prime Dashboard
                </button>
            </div>

            {mode === 'openclaw-sidecar' && <OpenClawSidecar />}
            {mode === 'aegis-ide' && <AgenticIDE />}
            {mode === 'mirror-prime' && <MirrorPrimeDashboard />}
        </div>
    );
}
