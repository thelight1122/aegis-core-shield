import React, { useState } from 'react';
import { AegisAgent, AegisSwarm } from '../types/ide';

interface SwarmManagerProps {
    agents: AegisAgent[];
    swarms: AegisSwarm[];
    onAddSwarm: (swarm: AegisSwarm) => void;
}

export default function SwarmManager({ agents, swarms, onAddSwarm }: SwarmManagerProps) {
    const [name, setName] = useState('');
    const [objective, setObjective] = useState('');
    const [topology, setTopology] = useState<'round-robin' | 'hierarchical'>('round-robin');
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

    // For hierarchical:
    const [leadAgentId, setLeadAgentId] = useState<string>('');

    const toggleAgent = (id: string) => {
        setSelectedAgents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDeploy = () => {
        if (!name || selectedAgents.length === 0) return;

        const newSwarm: AegisSwarm = {
            id: `swarm-${Date.now()}`,
            name,
            objective,
            status: 'idle',
            sharedContext: [{ timestamp: new Date().toISOString(), content: `Swarm ${name} instantiated.` }],
            topology: {
                type: topology,
                memberIds: selectedAgents,
                leadAgentId: topology === 'hierarchical' ? leadAgentId : undefined
            }
        };
        onAddSwarm(newSwarm);
        setName('');
        setObjective('');
        setSelectedAgents([]);
    };

    return (
        <div className="registry-panel">
            <h3>Swarm Manager</h3>
            <div className="registry-list">
                {swarms.length === 0 && <span className="text-muted">No active swarms.</span>}
                {swarms.map(s => (
                    <div key={s.id} className="registry-item">
                        <span className="registry-name">{s.name}</span>
                        <span className="registry-role text-muted">{s.topology.memberIds.length} agents</span>
                    </div>
                ))}
            </div>
            <div className="registry-form">
                <h4>Assemble Swarm</h4>
                <input type="text" placeholder="Swarm Name" value={name} onChange={e => setName(e.target.value)} />
                <input type="text" placeholder="Objective" value={objective} onChange={e => setObjective(e.target.value)} />
                <select title="Swarm Topology" value={topology} onChange={e => setTopology(e.target.value as any)}>
                    <option value="round-robin">Round Robin</option>
                    <option value="hierarchical">Hierarchical</option>
                </select>

                {topology === 'hierarchical' && (
                    <select title="Lead Agent ID" value={leadAgentId} onChange={e => setLeadAgentId(e.target.value)}>
                        <option value="">Select Lead Agent...</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                )}

                <div className="agent-selector">
                    <h5>Assign Agents</h5>
                    {agents.map(a => (
                        <label key={a.id} className="label-block">
                            <input
                                type="checkbox"
                                checked={selectedAgents.includes(a.id)}
                                onChange={() => toggleAgent(a.id)}
                            /> {a.name}
                        </label>
                    ))}
                </div>
                <button onClick={handleDeploy}>Deploy Swarm</button>
            </div>
        </div>
    );
}
