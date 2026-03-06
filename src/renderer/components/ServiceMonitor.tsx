import React from 'react';
import AgentCard from './AgentCard';
import NebulaMirror from './NebulaMirror';
import { AegisAgent } from '../types/ide';

interface ServiceMonitorProps {
    agents: AegisAgent[];
    coherence: number;
    fracturedVirtues: string[];
}

export default function ServiceMonitor({ agents, coherence, fracturedVirtues }: ServiceMonitorProps) {
    return (
        <div className="service-monitor">
            <NebulaMirror coherence={coherence} fracturedVirtues={fracturedVirtues} />
            <div className="agent-grid">
                {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>
        </div>
    );
}
