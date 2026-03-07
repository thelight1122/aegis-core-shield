import React from 'react';
import AgentCard from './AgentCard';
import NebulaMirror from './NebulaMirror';
import { AegisAgent } from '../types/ide';

interface ServiceMonitorProps {
    agents: AegisAgent[];
    workspacePath: string | null;
    coherence: number;
    fracturedVirtues: string[];
    onInjectIntervention?: (agentId: string, prompt: string) => void;
    onDistillTensors?: () => void;
}

export default function ServiceMonitor({ agents, workspacePath, coherence, fracturedVirtues, onInjectIntervention, onDistillTensors }: ServiceMonitorProps) {
    return (
        <div className="service-monitor">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <NebulaMirror coherence={coherence} fracturedVirtues={fracturedVirtues} />
                {onDistillTensors && (
                    <button
                        className="btn btn-sm btn-distill"
                        onClick={onDistillTensors}
                        title="Compress history tensors into Alignment Postures to free up token context"
                    >
                        ⚗️ Distill Tensors
                    </button>
                )}
            </div>
            <div className="agent-grid">
                {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} workspacePath={workspacePath} onInjectIntervention={onInjectIntervention} />
                ))}
            </div>
        </div>
    );
}
