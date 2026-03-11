import React from 'react';
import { AegisAgent } from '../types/ide';

interface AgentCardProps {
    agent: AegisAgent;
    workspacePath: string | null;
    onInjectIntervention?: (agentId: string, prompt: string) => void;
}

export default function AgentCard({ agent, workspacePath, onInjectIntervention }: AgentCardProps) {
    const [interventionText, setInterventionText] = React.useState('');
    const [scrubOffset, setScrubOffset] = React.useState(0);

    const handleInject = () => {
        if (!interventionText.trim() || !onInjectIntervention) return;
        onInjectIntervention(agent.id, interventionText.trim());
        setInterventionText('');
    };

    // Calculate maximum historical depth across all tensors
    const maxDepth = Math.max(
        agent.dataQuad.context.length,
        agent.dataQuad.affect.length,
        agent.dataQuad.memory.length,
        agent.dataQuad.learning.length
    );

    // If there are less than 2 items, maxOffset is 0. Otherwise, we can step back.
    const maxOffset = Math.max(0, maxDepth - 2);

    const getWindow = (arr: any[]) => {
        const end = arr.length - scrubOffset;
        const start = Math.max(0, end - 2);
        return arr.slice(start, end);
    };

    const handleDeployDaemon = async () => {
        try {
            const token = await window.aegisAPI?.getDaemonToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('http://localhost:8787/daemon/deploy', {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...agent, workspacePath })
            });
            if (res.ok) {
                alert(`Agent ${agent.name} deployed to Daemon successfully.`);
            } else {
                const errData = await res.json();
                alert(`Daemon deploy failed: ${errData.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            alert(`Could not reach daemon: ${e.message}`);
        }
    };

    return (
        <div className="agent-card">
            <div className="agent-header">
                <div className="agent-card-header-info">
                    <strong>{agent.name} ({agent.role})</strong>
                    <div className="dataquad-scrubber mt-1 d-flex align-items-center agent-card-scrubber">
                        <span>History:</span>
                        <input
                            type="range"
                            min="0"
                            max={maxOffset}
                            step="1"
                            value={maxOffset - scrubOffset}
                            onChange={(e) => setScrubOffset(maxOffset - parseInt(e.target.value, 10))}
                            className="agent-scrub-input"
                            disabled={maxOffset === 0}
                            title="Scrub DataQuad Memory"
                        />
                        <span>{scrubOffset === 0 ? 'Live' : `-${scrubOffset}`}</span>
                    </div>
                </div>
                <div className="agent-status-actions d-flex flex-column align-items-end">
                    <span className={`agent-status ${agent.status} mb-1`}>{agent.status}</span>
                    <button className="btn btn-outline-info btn-sm btn-deploy-daemon" onClick={handleDeployDaemon} title="Push Agent to Headless Daemon">
                        ☁️ Daemon
                    </button>
                </div>
            </div>
            <div className="agent-id">{agent.id}</div>
            <div className="data-quad-grid">
                <div className="quad-cell">
                    <h4>Context</h4>
                    <div className="quad-logs">
                        {getWindow(agent.dataQuad.context).map((item, idx) => (
                            <div key={idx} className="log-entry">
                                <span className="log-ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <span>{item.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="quad-cell">
                    <h4>Affect</h4>
                    <div className="quad-logs">
                        {getWindow(agent.dataQuad.affect).map((item, idx) => (
                            <div key={idx} className="log-entry">
                                <span className="log-ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <span>{item.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="quad-cell">
                    <h4>Memory</h4>
                    <div className="quad-logs">
                        {getWindow(agent.dataQuad.memory).map((item, idx) => (
                            <div key={idx} className="log-entry">
                                <span className="log-ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <span>{item.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="quad-cell">
                    <h4>Learning</h4>
                    <div className="quad-logs">
                        {getWindow(agent.dataQuad.learning).map((item: any, idx) => (
                            <div key={idx} className="log-entry">
                                <span className="log-ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <span>{item.content}</span>
                                {item.type === 'reflection' && item.sequenceData && (
                                    <div className="reflection-sequence">
                                        <strong>{item.sequenceData.type} Sequence Initiated:</strong>
                                        {item.sequenceData.stages.map((stage: { stage: string, content: string }, i: number) => (
                                            <div key={i} className="reflection-stage">
                                                <span className="stage-name">[{stage.stage}]</span> {stage.content}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {onInjectIntervention && (
                <div className="agent-intervention-footer mt-3">
                    <div className="d-flex intervention-group">
                        <input
                            type="text"
                            placeholder="Steward Intervention Prompt..."
                            value={interventionText}
                            onChange={(e) => setInterventionText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleInject();
                                }
                            }}
                            className="form-control intervention-input"
                        />
                        <button
                            onClick={handleInject}
                            disabled={!interventionText.trim()}
                            className="btn btn-sm btn-inject"
                        >
                            Inject
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
