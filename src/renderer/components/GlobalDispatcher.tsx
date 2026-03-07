import React from 'react';
import { AegisAgent, AegisSwarm, PendingAction } from '../types/ide';
import CodeEditor from './CodeEditor';
import { DiffEditor } from '@monaco-editor/react';

interface GlobalDispatcherProps {
    agents: AegisAgent[];
    swarms: AegisSwarm[];
    approvalQueue?: PendingAction[];
    onDispatch: (targetId: string, type: 'agent' | 'swarm', prompt: string) => void;
    onResolveAction?: (actionId: string, approved: boolean) => void;
}

export default function GlobalDispatcher({ agents, swarms, approvalQueue = [], onDispatch, onResolveAction }: GlobalDispatcherProps) {
    const [target, setTarget] = React.useState<string>('');
    const [prompt, setPrompt] = React.useState('');

    const handleDispatch = () => {
        if (!target || !prompt) return;
        const [type, id] = target.split(':');
        onDispatch(id, type as 'agent' | 'swarm', prompt);
        setPrompt('');
    };

    return (
        <div className="dispatcher-panel">
            <div className="dispatcher-header">
                <h3>Global Mission Dispatcher</h3>
                <span className="gate-badge">AEGIS Gate Active</span>
            </div>

            <div className="dispatcher-controls">
                <select title="Dispatcher Target" value={target} onChange={e => setTarget(e.target.value)}>
                    <option value="">Select Target...</option>
                    <optgroup label="Individual Agents">
                        {agents.map(a => <option key={a.id} value={`agent:${a.id}`}>{a.name} ({a.role})</option>)}
                    </optgroup>
                    <optgroup label="Deployed Swarms">
                        {swarms.map(s => <option key={s.id} value={`swarm:${s.id}`}>{s.name} ({s.topology.memberIds.length} agents)</option>)}
                    </optgroup>
                </select>

                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter objective or prompt... All tasks route through the Discernment Gate."
                    rows={4}
                />
                <button onClick={handleDispatch} disabled={!target || !prompt}>
                    Dispatch Mission
                </button>
            </div>

            {approvalQueue.length > 0 && (
                <div className="approval-queue-container mt-4">
                    <h4 className="text-warning mb-2" style={{ color: '#d2a8ff' }}>Actions Awaiting Steward Approval</h4>
                    <div className="approval-list">
                        {approvalQueue.map(action => {
                            const agent = agents.find(a => a.id === action.agentId);
                            return (
                                <div key={action.id} className="approval-card">
                                    <div className="d-flex justify-content-between">
                                        <strong>Agent: {agent?.name || action.agentId}</strong>
                                        <span className="badge approval-badge">{action.type.toUpperCase()}</span>
                                    </div>
                                    <div className="mt-2 mb-2" style={{ border: '1px solid #30363d', borderRadius: '4px', overflow: 'hidden' }}>
                                        <CodeEditor
                                            height="150px"
                                            readOnly
                                            value={action.payload}
                                            language={action.type === 'execute' ? 'shell' : 'javascript'}
                                        />
                                    </div>
                                    <div className="approval-btn-group">
                                        <button className="btn-approve" onClick={() => onResolveAction && onResolveAction(action.id, true)}>Approve (Run)</button>
                                        <button className="btn-reject" onClick={() => onResolveAction && onResolveAction(action.id, false)}>Reject</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
