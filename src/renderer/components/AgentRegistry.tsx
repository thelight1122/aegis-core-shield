import React, { useState } from 'react';
import { AegisAgent, createDefaultQuad } from '../types/ide';

interface AgentRegistryProps {
    agents: AegisAgent[];
    onAddAgent: (agent: AegisAgent) => void;
}

export default function AgentRegistry({ agents, onAddAgent }: AgentRegistryProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');

    const handleDeploy = () => {
        if (!name || !role) return;

        const newAgent: AegisAgent = {
            id: `agent-${Date.now()}`,
            name,
            role,
            status: 'idle',
            dataQuad: createDefaultQuad(`Agent ${name} deployed with role ${role}`)
        };
        onAddAgent(newAgent);
        setName('');
        setRole('');
    };

    return (
        <div className="registry-panel">
            <h3>Agent Registry</h3>
            <div className="registry-list">
                {agents.map(a => (
                    <div key={a.id} className="registry-item">
                        <span className="registry-name">{a.name}</span>
                        <span className="registry-role text-muted">{a.role}</span>
                    </div>
                ))}
            </div>

            <div className="registry-form">
                <h4>Deploy New Agent</h4>
                <input
                    type="text"
                    placeholder="Agent Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Role (e.g. Scraper, Analyst)"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                />
                <button onClick={handleDeploy}>Deploy Agent</button>
            </div>
        </div>
    );
}
