import React, { useState } from 'react';
import { AegisAgent, AegisTool } from '../types/ide';

export const AVAILABLE_TOOLS: AegisTool[] = [
    { id: 'fs-reader', name: 'File Reader', description: 'Read workspace files', restricted: false },
    { id: 'fs-writer', name: 'File Writer', description: 'Modify workspace files', restricted: true },
    { id: 'terminal-executor', name: 'Terminal Shell', description: 'Execute shell commands', restricted: true },
    { id: 'git-commit', name: 'Git Commit', description: 'Commit state changes', restricted: false },
    { id: 'web-search', name: 'Web Search', description: 'Query external sources', restricted: false },
    { id: 'npm-installer', name: 'NPM Installer', description: 'Install dependencies', restricted: true },
];

interface ToolManagerProps {
    agents: AegisAgent[];
    onUpdateAgentTools: (agentId: string, tools: AegisTool[]) => void;
}

export default function ToolManager({ agents, onUpdateAgentTools }: ToolManagerProps) {
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');

    const targetAgent = agents.find(a => a.id === selectedAgentId);

    const handleToggleTool = (tool: AegisTool) => {
        if (!targetAgent) return;
        const hasTool = targetAgent.tools.some(t => t.id === tool.id);
        let newTools = [...targetAgent.tools];
        if (hasTool) {
            newTools = newTools.filter(t => t.id !== tool.id);
        } else {
            newTools.push(tool);
        }
        onUpdateAgentTools(targetAgent.id, newTools);
    };

    return (
        <div className="registry-panel mt-3">
            <h3>Tool Registry</h3>
            <div className="mb-2">
                <select
                    className="form-control tool-agent-select"
                    title="Select Configuration Target"
                    value={selectedAgentId}
                    onChange={e => setSelectedAgentId(e.target.value)}
                >
                    <option value="">Select Agent to Configure</option>
                    {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                </select>
            </div>

            {targetAgent && (
                <div className="tools-list mt-2">
                    <h4 className="tools-available-title mb-2">Available Tools</h4>
                    {AVAILABLE_TOOLS.map(tool => {
                        const isAssigned = targetAgent.tools.some(t => t.id === tool.id);
                        return (
                            <div key={tool.id} className={`registry-item d-flex justify-content-between align-items-center mb-1 p-2 ${isAssigned ? 'tool-item-assigned' : 'tool-item-unassigned'}`}>
                                <div>
                                    <strong className={isAssigned ? 'tool-name-assigned' : 'tool-name-unassigned'}>{tool.name}</strong>
                                    {tool.restricted && <span className="badge bg-danger ms-2 tool-badge-restricted">RESTRICTED</span>}
                                    <div className="tool-desc">{tool.description}</div>
                                </div>
                                <button
                                    className={`btn btn-sm tool-action-btn ${isAssigned ? 'btn-danger' : 'btn-outline-primary'}`}
                                    onClick={() => handleToggleTool(tool)}
                                >
                                    {isAssigned ? 'Revoke' : 'Provision'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            {!targetAgent && (
                <div className="text-muted mt-2 text-center tool-unselected-msg">
                    Select an agent to manage provisions.
                </div>
            )}
        </div>
    );
}
