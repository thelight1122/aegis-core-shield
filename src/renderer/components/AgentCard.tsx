import React from 'react';
import { AegisAgent } from '../types/ide';

interface AgentCardProps {
    agent: AegisAgent;
}

export default function AgentCard({ agent }: AgentCardProps) {
    return (
        <div className="agent-card">
            <div className="agent-header">
                <strong>{agent.name} ({agent.role})</strong>
                <span className={`agent-status ${agent.status}`}>{agent.status}</span>
            </div>
            <div className="agent-id">{agent.id}</div>
            <div className="data-quad-grid">
                <div className="quad-cell">
                    <h4>Context</h4>
                    <div className="quad-logs">
                        {agent.dataQuad.context.slice(-2).map((item, idx) => (
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
                        {agent.dataQuad.affect.slice(-2).map((item, idx) => (
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
                        {agent.dataQuad.memory.slice(-2).map((item, idx) => (
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
                        {agent.dataQuad.learning.slice(-2).map((item, idx) => (
                            <div key={idx} className="log-entry">
                                <span className="log-ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <span>{item.content}</span>
                                {item.type === 'reflection' && item.sequenceData && (
                                    <div className="reflection-sequence">
                                        <strong>{item.sequenceData.type} Sequence Initiated:</strong>
                                        {item.sequenceData.stages.map((stage, i) => (
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
        </div>
    );
}
