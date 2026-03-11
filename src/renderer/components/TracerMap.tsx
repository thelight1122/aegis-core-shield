import React from 'react';
import { AegisAgent, AegisSwarm } from '../types/ide';

interface TracerMapProps {
    agents: AegisAgent[];
    swarms: AegisSwarm[];
}

export default function TracerMap({ agents, swarms }: TracerMapProps) {
    if (swarms.length === 0) {
        return (
            <div className="tracer-map registry-panel mt-4 empty-state">
                <h3 className="metrics-title">Diagnostic TracerMap</h3>
                <p className="p-4 text-center text-muted">No active swarms found. Deploy a swarm to see diagnostic traces.</p>
            </div>
        );
    }

    return (
        <div className="tracer-map registry-panel mt-4">
            <h3 className="metrics-title">Diagnostic TracerMap</h3>
            <div className="tracer-viewport p-2">
                {swarms.map(swarm => (
                    <div key={swarm.id} className="swarm-trace-group mb-4 p-2 border rounded border-opacity-10 border-white">
                        <div className="swarm-header-mini mb-2 font-bold text-xs uppercase tracking-wider text-blue-400">
                            Swarm: {swarm.name}
                        </div>
                        <div className="trace-nodes flex flex-wrap gap-2 items-center">
                            {swarm.topology.memberIds.map((id, idx) => {
                                const agent = agents.find(a => a.id === id);
                                return (
                                    <React.Fragment key={id}>
                                        <div className="trace-node-item flex items-center gap-2 p-1 px-2 bg-black bg-opacity-30 rounded text-xs">
                                            <div className={`node-status-dot w-2 h-2 rounded-full ${agent?.status === 'idle' ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></div>
                                            <span>{agent?.name || id}</span>
                                        </div>
                                        {idx < swarm.topology.memberIds.length - 1 && (
                                            <div className="trace-flow-arrow text-gray-600">→</div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="tracer-footer px-3 py-1 border-t border-white border-opacity-5 flex justify-between items-center">
                <small className="text-muted text-[10px]">IPC Visualization Layer</small>
                <div className="flex gap-2">
                    <span className="text-[10px] text-green-400">● Active</span>
                    <span className="text-[10px] text-gray-500">○ Idle</span>
                </div>
            </div>
        </div>
    );
}
