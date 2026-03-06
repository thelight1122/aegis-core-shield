import React, { useState } from 'react';
import { AegisAgent, AegisSwarm } from '../types/ide';

interface GlobalDispatcherProps {
    agents: AegisAgent[];
    swarms: AegisSwarm[];
    onDispatch: (targetId: string, type: 'agent' | 'swarm', prompt: string) => void;
}

export default function GlobalDispatcher({ agents, swarms, onDispatch }: GlobalDispatcherProps) {
    const [target, setTarget] = useState<string>('');
    const [prompt, setPrompt] = useState('');

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
        </div>
    );
}
