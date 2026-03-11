import React, { useState } from 'react';
import MirrorPrimeDashboard from './components/MirrorPrimeDashboard';
import OpenClawSidecar from './components/OpenClawSidecar';
import AgenticIDE from './components/AgenticIDE';
import { TutorialProvider, useTutorial, TutorialStep } from './components/TutorialProvider';
import TutorialOverlay from './components/TutorialOverlay';
import './Dashboard.css';

type AgenticMode = 'openclaw-sidecar' | 'aegis-ide' | 'mirror-prime';

const tutorialSteps: TutorialStep[] = [
    {
        targetSelector: '[data-tutorial="mode-toggle"]',
        title: 'Operating Modes',
        content: <p>AEGIS operates in three modes. We'll focus on <strong>Agentic IDE</strong> for managing governed agent swarms.</p>,
        placement: 'bottom'
    },
    {
        targetSelector: '[data-tutorial="agent-registry"]',
        title: 'Agent Registry',
        content: <p>Spawn new agents here. Try clicking <strong>+ Create Agent</strong> to spin up a new swarm member.</p>,
        placement: 'right'
    },
    {
        targetSelector: '[data-tutorial="tool-manager"]',
        title: 'Tool Manager',
        content: <p>Assign tools like <strong>fs-reader</strong> or <strong>fs-writer</strong> to grant agents specific capabilities.</p>,
        placement: 'right'
    },
    {
        targetSelector: '[data-tutorial="workspace-selector"]',
        title: 'Target Workspace',
        content: <p>Select the local folder where agents will operate. Click <strong>Browse</strong> to choose a folder.</p>,
        placement: 'bottom'
    },
    {
        targetSelector: '[data-tutorial="global-dispatcher"]',
        title: 'Global Mission Dispatcher',
        content: <p>All prompts pass through the Discernment Gate. Select an agent and try <code>!read package.json</code>.</p>,
        placement: 'bottom'
    }
];

function DashboardContent() {
    const [mode, setMode] = useState<AgenticMode>('aegis-ide');
    const { startTutorial } = useTutorial();

    return (
        <div className="dashboard-container">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                    <h1 className="dashboard-title mb-0">AEGIS Core Shield</h1>
                    <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => { setMode('aegis-ide'); setTimeout(() => startTutorial(tutorialSteps), 300); }}
                    >
                        🚀 Start Interactive Tutorial
                    </button>
                </div>
                <div className="mode-toggle" data-tutorial="mode-toggle">
                    <button
                        className={`mode-button ${mode === 'openclaw-sidecar' ? 'active' : ''}`}
                        onClick={() => setMode('openclaw-sidecar')}
                    >
                        Alongside OpenClaw
                    </button>
                    <button
                        className={`mode-button ${mode === 'aegis-ide' ? 'active' : ''}`}
                        onClick={() => setMode('aegis-ide')}
                    >
                        AEGIS Agentic IDE
                    </button>
                    <button
                        className={`mode-button ${mode === 'mirror-prime' ? 'active' : ''}`}
                        onClick={() => setMode('mirror-prime')}
                    >
                        Mirror Prime
                    </button>
                    <button 
                        className="btn-exit-app"
                        onClick={() => window.close()}
                        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Logout & Exit
                    </button>
                </div>
            </div>

            {mode === 'openclaw-sidecar' && <OpenClawSidecar />}
            {mode === 'aegis-ide' && <AgenticIDE />}
            {mode === 'mirror-prime' && <MirrorPrimeDashboard />}
            
            <TutorialOverlay />
        </div>
    );
}

export default function Dashboard() {
    return (
        <TutorialProvider>
            <DashboardContent />
        </TutorialProvider>
    );
}
