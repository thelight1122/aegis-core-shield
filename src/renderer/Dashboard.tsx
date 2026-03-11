import React, { useState } from 'react';
import MirrorPrimeDashboard from './components/MirrorPrimeDashboard';
import OpenClawSidecar from './components/OpenClawSidecar';
import AgenticIDE from './components/AgenticIDE';
import { TutorialProvider, useTutorial, TutorialStep } from './components/TutorialProvider';
import TutorialOverlay from './components/TutorialOverlay';

export type AgenticMode = 'openclaw-sidecar' | 'aegis-ide' | 'mirror-prime';

const tutorialSteps: TutorialStep[] = [
    {
        targetSelector: '[data-tutorial="mode-toggle"]',
        title: 'Operating Modes',
        content: <p>AEGIS operates in three modes. We will focus on the <strong>Agentic IDE</strong> where you deploy and manage your governed agent swarms.</p>,
        placement: 'bottom'
    },
    {
        targetSelector: '[data-tutorial="agent-registry"]',
        title: 'Agent Registry',
        content: <p>This is where you spawn new agents. Try clicking <strong>+ Create Agent</strong> right now to spin up a new member of your swarm.</p>,
        placement: 'right'
    },
    {
        targetSelector: '[data-tutorial="tool-manager"]',
        title: 'Tool Manager',
        content: <p>Agents cannot hurt your system without tools. Select one of your agents and try assigning them the <strong>fs-reader</strong> and <strong>fs-writer</strong> tools to grant them filesystem access.</p>,
        placement: 'right'
    },
    {
        targetSelector: '[data-tutorial="workspace-selector"]',
        title: 'Target Workspace',
        content: <p>Select the folder on your local machine that you want the agents to operate inside. <strong>Action: </strong> Click "Browse" and select a test folder.</p>,
        placement: 'bottom'
    },
    {
        targetSelector: '[data-tutorial="global-dispatcher"]',
        title: 'Global Mission Dispatcher',
        content: <p>Every prompt you enter here passes through the Discernment Gate. <strong>First, select an Agent from the dropdown</strong>, then try asking them to <code>!read package.json</code>. If they try a destructive action (like <code>!write</code>), you'll have to explicitly approve it in the queue below.</p>,
        placement: 'bottom'
    }
];

function DashboardContent() {
    const [mode, setMode] = useState<AgenticMode>('openclaw-sidecar');
    const { startTutorial } = useTutorial();

    return (
        <div className="dashboard-container">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                    <h1 className="dashboard-title mb-0">AEGIS Core Shield</h1>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => { setMode('aegis-ide'); setTimeout(() => startTutorial(tutorialSteps), 300); }}>
                        🚀 Start Interactive Tutorial
                    </button>
                </div>
            </div>
            
            <p>Choose runtime mode: run alongside OpenClaw, use the AEGIS IDE, or monitor the swarm via Mirror Prime.</p>

            <div className="mode-toggle" data-tutorial="mode-toggle">
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
