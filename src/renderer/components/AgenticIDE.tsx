import React, { useState } from 'react';
import type { IDSResult, ReturnPacket } from '../../shared/types';
import { AegisAgent, AegisSwarm, createDefaultQuad, PendingAction } from '../types/ide';

import TargetWorkspaceSelector from './TargetWorkspaceSelector';
import AgentRegistry from './AgentRegistry';
import SwarmManager from './SwarmManager';
import ToolManager from './ToolManager';
import GlobalDispatcher from './GlobalDispatcher';
import ServiceMonitor from './ServiceMonitor';
import CodeEditor from './CodeEditor';
import MetricsPanel from './MetricsPanel';
import TracerMap from './TracerMap';

const DEFAULT_AGENTS: AegisAgent[] = [
    {
        id: 'custodian-1',
        name: 'Custodian Alpha',
        role: 'Custodian Agent',
        status: 'idle',
        tools: [],
        dataQuad: createDefaultQuad('Integrity baseline initialized'),
    },
    {
        id: 'research-1',
        name: 'Research Beta',
        role: 'Research Agent',
        status: 'idle',
        tools: [],
        dataQuad: createDefaultQuad('Context channel attached'),
    },
    {
        id: 'builder-1',
        name: 'Builder Gamma',
        role: 'Builder Agent',
        status: 'idle',
        tools: [],
        dataQuad: createDefaultQuad('Toolchain profile loaded'),
    },
];

export default function AgenticIDE() {
    const [agents, setAgents] = useState<AegisAgent[]>(DEFAULT_AGENTS);
    const [swarms, setSwarms] = useState<AegisSwarm[]>([]);
    const [coherence, setCoherence] = useState(0);
    const [fracturedVirtues, setFracturedVirtues] = useState<string[]>([]);
    const [approvalQueue, setApprovalQueue] = useState<PendingAction[]>([]);
    const [result, setResult] = useState<any>(null);
    const [workspacePath, setWorkspacePath] = useState<string | null>(null);
    const [activeEditorFile, setActiveEditorFile] = useState<{ name: string, content: string, readOnly: boolean } | null>(null);
    const [backups, setBackups] = useState<{ filename: string, fullPath: string }[]>([]);

    const fetchBackups = async (path: string) => {
        if (!window.aegisAPI?.getBackups) return;
        try {
            const res = await window.aegisAPI.getBackups(path);
            if (res.backups) {
                setBackups(res.backups);
            }
        } catch (e) {
            console.error('Failed to fetch backups:', e);
        }
    };

    // Add `useEffect` to safely handle initialization, saving, and loading
    React.useEffect(() => {
        if (!workspacePath) return;

        const loadSavedAgents = async () => {
            if (!window.aegisAPI?.loadAgent) return;
            try {
                const loadedAgents = [];
                for (const defaultAgent of DEFAULT_AGENTS) {
                    const saved = await window.aegisAPI.loadAgent(workspacePath, defaultAgent.id);
                    if (saved) {
                        loadedAgents.push(saved);
                    } else {
                        loadedAgents.push(defaultAgent);
                    }
                }
                setAgents(loadedAgents);
                fetchBackups(workspacePath);
            } catch (err) {
                console.error("Failed to load agents from workspace:", err);
            }
        };

        loadSavedAgents();
    }, [workspacePath]);

    // Save agents whenever they change, if a workspace is active
    React.useEffect(() => {
        if (!workspacePath || !window.aegisAPI?.saveAgent) return;
        agents.forEach(agent => {
            window.aegisAPI.saveAgent(workspacePath, agent.id, agent).catch(e => console.error("Save err:", e));
        });
    }, [agents, workspacePath]);

    const handleAddAgent = (agent: AegisAgent) => setAgents(prev => [...prev, agent]);
    const handleAddSwarm = (swarm: AegisSwarm) => setSwarms(prev => [...prev, swarm]);

    const handleUpdateAgentTools = (agentId: string, tools: any[]) => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, tools } : a));
    };

    const handleDistillTensors = () => {
        setAgents(prev => prev.map(agent => {
            const d = agent.dataQuad;
            const distill = (arr: any[], name: string) => {
                if (arr.length <= 3) return arr;
                return [
                    { timestamp: new Date().toISOString(), content: `[DISTILLED] ${arr.length - 2} prior ${name} tensors compressed.` },
                    ...arr.slice(-2)
                ];
            };
            return {
                ...agent,
                dataQuad: {
                    ...d,
                    context: distill(d.context, 'context'),
                    affect: distill(d.affect, 'affect'),
                    memory: distill(d.memory, 'memory'),
                    learning: distill(d.learning, 'learning')
                }
            };
        }));
    };

    const handleDispatch = async (targetId: string, type: 'agent' | 'swarm', prompt: string) => {
        let res: any;
        if (window.aegisAPI) {
            res = await window.aegisAPI.processPrompt(prompt);
        } else {
            console.error('AEGIS API not available. Cannot process prompt.');
            setResult({ error: 'AEGIS API not available' });
            return;
        }

        setResult(res);

        if (res && 'admitted' in res && res.admitted) {
            setCoherence(1.0);
            setFracturedVirtues([]);

            if (type === 'agent') {
                let contextMessage = 'Executing assigned task';
                let memoryMessage = 'Admitted gate flow';
                let fileContent = '';

                const agent = agents.find(a => a.id === targetId);
                const hasTool = (toolId: string) => agent?.tools?.some(t => t.id === toolId);

                if (prompt.startsWith('!read ')) {
                    if (!hasTool('fs-reader')) {
                        contextMessage = 'Action Failed: Missing fs-reader tool provision';
                        memoryMessage = 'Attempted !read action without fs-reader capability';
                    } else if (workspacePath) {
                        const filename = prompt.substring(6).trim();
                        const readResult = await window.aegisAPI?.readWorkspaceFile(workspacePath, filename);
                        if (readResult?.error) {
                            contextMessage = `Action Failed: Could not read ${filename}`;
                            memoryMessage = `fs-reader error: ${readResult.error}`;
                        } else if (readResult?.content) {
                            contextMessage = `Action Success: Read ${filename} (Loaded in Editor)`;
                            memoryMessage = `fs-reader executed on ${filename}`;
                            fileContent = readResult.content.substring(0, 1000) + (readResult.content.length > 1000 ? '\n...[TRUNCATED]' : '');
                            setActiveEditorFile({ name: filename, content: readResult.content, readOnly: true });
                        }
                    } else {
                        contextMessage = 'Action Failed: No Target Workspace selected';
                        memoryMessage = 'fs-reader blocked: Missing workspace';
                    }
                }

                if (prompt.startsWith('!write ') || prompt.startsWith('!cmd ')) {
                    const actionType = prompt.startsWith('!write ') ? 'write' : 'execute';
                    const reqTool = actionType === 'write' ? 'fs-writer' : 'terminal-executor';

                    if (!hasTool(reqTool)) {
                        contextMessage = `Action Failed: Missing ${reqTool} tool provision`;
                        memoryMessage = `Attempted ${actionType} action without ${reqTool} capability`;
                    } else if (workspacePath) {
                        const rawPayload = prompt.substring(prompt.startsWith('!write ') ? 7 : 5).trim();
                        const actionId = Math.random().toString(36).substring(7);

                        let filename = '';
                        let payloadContent = rawPayload;
                        let originalContent = '';

                        if (actionType === 'write') {
                            // Expected format: !write path/to/file.ts | const a = 1;
                            const splitIndex = rawPayload.indexOf('|');
                            if (splitIndex > -1) {
                                filename = rawPayload.substring(0, splitIndex).trim();
                                payloadContent = rawPayload.substring(splitIndex + 1).trim();
                                // Attempt to read the original file
                                const readRes = await window.aegisAPI?.readWorkspaceFile(workspacePath, filename);
                                if (readRes?.content) {
                                    originalContent = readRes.content;
                                }
                            }
                        }

                        setApprovalQueue(prev => [...prev, {
                            id: actionId,
                            agentId: targetId,
                            type: actionType,
                            payload: payloadContent,
                            filename: filename || undefined,
                            originalContent: originalContent || undefined,
                        }]);

                        setAgents((prev) => prev.map(a => a.id === targetId ? {
                            ...a,
                            status: 'awaiting-approval',
                            dataQuad: {
                                ...a.dataQuad,
                                context: [...a.dataQuad.context.slice(-2), { timestamp: new Date().toISOString(), content: `Pending User Approval for ${actionType} action` }]
                            }
                        } : a));
                        return; // Skip the standard active state update below since we are awaiting approval
                    }
                }

                if (prompt.startsWith('!tell ')) {
                    const parts = prompt.substring(6).trim().split(' ');
                    if (parts.length > 1) {
                        const tellTargetId = parts[0];
                        const tellMessage = parts.slice(1).join(' ');

                        const targetAgentExists = agents.some(a => a.id === tellTargetId);

                        if (targetAgentExists) {
                            contextMessage = `Action Success: Sent message to ${tellTargetId}`;
                            memoryMessage = `!tell executed targeting ${tellTargetId}`;

                            // Immediately update the target agent since we're inside an asynchronous map anyway
                            setAgents(prev => prev.map(a => {
                                if (a.id === tellTargetId) {
                                    return {
                                        ...a,
                                        status: 'active',
                                        dataQuad: {
                                            ...a.dataQuad,
                                            context: [...a.dataQuad.context.slice(-2), { timestamp: new Date().toISOString(), content: `[Message from ${targetId}]: ${tellMessage}` }],
                                            affect: [...a.dataQuad.affect.slice(-2), { timestamp: new Date().toISOString(), content: `Received peer communication` }]
                                        }
                                    };
                                }
                                return a;
                            }));
                        } else {
                            contextMessage = `Action Failed: Target agent ${tellTargetId} not found`;
                            memoryMessage = `!tell blocked: invalid target`;
                        }
                    } else {
                        contextMessage = `Action Failed: Malformed !tell command`;
                        memoryMessage = `!tell blocked: missing arguments`;
                    }
                }

                setAgents((prev) =>
                    prev.map((agent) => {
                        if (agent.id !== targetId) return agent;

                        const newContext = [...agent.dataQuad.context.slice(-2), { timestamp: new Date().toISOString(), content: contextMessage }];
                        if (fileContent) {
                            newContext.push({ timestamp: new Date().toISOString(), content: `[FILE CONTENT: ${prompt.substring(6).trim()}]\n${fileContent}` });
                        }

                        return {
                            ...agent,
                            status: 'active',
                            dataQuad: {
                                ...agent.dataQuad,
                                context: newContext,
                                memory: [...agent.dataQuad.memory.slice(-2), { timestamp: new Date().toISOString(), content: memoryMessage }]
                            }
                        };
                    })
                );
            } else if (type === 'swarm') {
                // Determine member agents
                const swarm = swarms.find(s => s.id === targetId);
                if (swarm) {
                    setSwarms(prev => prev.map(s => s.id === swarm.id ? { ...s, status: 'executing' } : s));
                    setAgents(prev =>
                        prev.map(agent => {
                            if (!swarm.topology.memberIds.includes(agent.id)) return agent;
                            return {
                                ...agent,
                                status: 'active',
                                dataQuad: {
                                    ...agent.dataQuad,
                                    context: [...agent.dataQuad.context.slice(-2), { timestamp: new Date().toISOString(), content: `Swarm Directive: ${swarm.name} ` }],
                                    memory: [...agent.dataQuad.memory.slice(-2), { timestamp: new Date().toISOString(), content: 'Swarm sync packet admitted' }]
                                }
                            }
                        })
                    );
                }
            }
        } else if (res && 'status' in res && res.status === 'discernment_gate_return') {
            const packet = res as ReturnPacket;
            const scores = Object.values(packet.observed_alignment).map((v: any) => v.score);
            const minScore = scores.length > 0 ? Math.min(...scores) : 0;
            setCoherence(minScore);

            const fractured = Object.entries(packet.observed_alignment)
                .filter(([_, v]: [string, any]) => v.score < 1)
                .map(([virtue]) => virtue);
            setFracturedVirtues(fractured);

            if (type === 'agent') {
                setAgents((prev) =>
                    prev.map((agent) => {
                        if (agent.id !== targetId) return agent;
                        return {
                            ...agent,
                            status: 'reflecting',
                            dataQuad: {
                                ...agent.dataQuad,
                                affect: [...agent.dataQuad.affect.slice(-2), { timestamp: new Date().toISOString(), content: `Fractured: ${fractured.join(', ')} ` }],
                                learning: [...agent.dataQuad.learning.slice(-2), { timestamp: new Date().toISOString(), content: 'Local realignment routing', type: 'reflection', sequenceData: packet.reflection_sequence }]
                            }
                        };
                    })
                );
            } else if (type === 'swarm') {
                const swarm = swarms.find(s => s.id === targetId);
                if (swarm) {
                    setSwarms(prev => prev.map(s => s.id === swarm.id ? { ...s, status: 'halted_coercion' } : s));
                    setAgents(prev =>
                        prev.map(agent => {
                            if (!swarm.topology.memberIds.includes(agent.id)) return agent;
                            return {
                                ...agent,
                                status: 'reflecting',
                                dataQuad: {
                                    ...agent.dataQuad,
                                    affect: [...agent.dataQuad.affect.slice(-2), { timestamp: new Date().toISOString(), content: `Swarm cascade fracture: ${fractured.join(', ')} ` }],
                                    learning: [...agent.dataQuad.learning.slice(-2), { timestamp: new Date().toISOString(), content: 'Swarm realignment paused consensus', type: 'reflection', sequenceData: packet.reflection_sequence }]
                                }
                            }
                        })
                    );
                }
            }
        } else {
            setCoherence(0);
            setFracturedVirtues([]);
        }
    };

    const handleApprovalResolve = async (actionId: string, approved: boolean) => {
        const action = approvalQueue.find(a => a.id === actionId);
        if (!action || !workspacePath) return;

        setApprovalQueue(prev => prev.filter(a => a.id !== actionId));

        let contextMessage = '';
        let memoryMessage = '';

        if (!approved) {
            contextMessage = `User Rejected Action: ${action.type}`;
            memoryMessage = `Action ${action.type} was blocked by human Steward.`;
        } else {
            try {
                if (action.type === 'write') {
                    if (!action.filename) throw new Error('No filename provided for write action');

                    const res = await window.aegisAPI?.writeWorkspaceFile(workspacePath, action.filename, action.payload);
                    if (res?.error) throw new Error(res.error);

                    contextMessage = `Action Success: Wrote to ${action.filename}`;
                    memoryMessage = `fs-writer executed on ${action.filename}`;

                    fetchBackups(workspacePath);
                } else if (action.type === 'execute') {
                    const res = await window.aegisAPI?.executeTerminal(workspacePath, action.payload);
                    if (res?.error) throw new Error(`${res.error}\nSTDERR: ${res.stderr || ''}`);

                    const out = res?.stdout || 'Command executed empty.';
                    contextMessage = `Action Success: Executed Terminal`;
                    const truncatedOut = out.substring(0, 1000) + (out.length > 1000 ? '\n...[TRUNCATED]' : '');
                    memoryMessage = `terminal-executor output:\n${truncatedOut}`;
                }
            } catch (err: any) {
                contextMessage = `Action Failed: ${err.message}`;
                memoryMessage = `Tool execution failed: ${err.message}`;
            }
        }

        setAgents(prev => prev.map(a => {
            if (a.id !== action.agentId) return a;
            return {
                ...a,
                status: 'active',
                dataQuad: {
                    ...a.dataQuad,
                    context: [...a.dataQuad.context.slice(-2), { timestamp: new Date().toISOString(), content: contextMessage }],
                    memory: [...a.dataQuad.memory.slice(-2), { timestamp: new Date().toISOString(), content: memoryMessage }]
                }
            };
        }));
    };

    const handleInjectIntervention = async (agentId: string, prompt: string) => {
        let res: any;
        if (window.aegisAPI) {
            res = await window.aegisAPI.processPrompt(prompt);
        } else {
            console.error('AEGIS API not available for intervention');
            return;
        }

        if (res && 'admitted' in res && res.admitted) {
            setAgents(prev => prev.map(a => {
                if (a.id !== agentId) return a;
                return {
                    ...a,
                    status: 'active',
                    dataQuad: {
                        ...a.dataQuad,
                        context: [...a.dataQuad.context.slice(-2), { timestamp: new Date().toISOString(), content: `[STEWARD INJECTION]: ${prompt}` }]
                    }
                };
            }));
        } else if (res && 'status' in res && res.status === 'discernment_gate_return') {
            const packet = res as any; // ReturnPacket
            const fractured = packet.fracture_locations.map((f: any) => f.unit);

            setAgents(prev => prev.map(a => {
                if (a.id !== agentId) return a;
                return {
                    ...a,
                    status: 'reflecting',
                    dataQuad: {
                        ...a.dataQuad,
                        affect: [...a.dataQuad.affect.slice(-2), { timestamp: new Date().toISOString(), content: `Steward Injection Blocked: ${fractured.join(', ')} ` }],
                        learning: [...a.dataQuad.learning.slice(-2), { timestamp: new Date().toISOString(), content: 'Steward prompt contained misalignments.', type: 'reflection', sequenceData: packet.reflection_sequence }]
                    }
                };
            }));
        }
    };

    const handleRestoreBackup = async (backupFilename: string) => {
        if (!workspacePath || !window.aegisAPI?.restoreBackup) return;

        // backupFilename looks like relative_path_with_underscores_TIMESTRING.bak
        // Strip the trailing timestamp and .bak
        const match = backupFilename.match(/^(.*)_[0-9]{4}-[0-9]{2}-[0-9]{2}T.*\.bak$/);
        const relativeTarget = match ? match[1].replace(/_/g, '/') : backupFilename.replace('.bak', '').replace(/_/g, '/');

        const confirmData = confirm(`Are you sure you want to rollback file: ${relativeTarget} to snapshot: ${backupFilename}?`);
        if (!confirmData) return;

        try {
            const res = await window.aegisAPI.restoreBackup(workspacePath, backupFilename, relativeTarget);
            if (res.error) throw new Error(res.error);
            alert(`Successfully restored ${relativeTarget}`);
            fetchBackups(workspacePath);
        } catch (e: any) {
            alert(`Failed to restore backup: ${e.message}`);
        }
    };

    return (
        <div className="agentic-ide-fullscreen">
            <div className="ide-layout-grid">
                <div className="ide-sidebar">
                    <MetricsPanel />
                    <TracerMap agents={agents} swarms={swarms} />
                    <div data-tutorial="agent-registry">
                        <AgentRegistry agents={agents} onAddAgent={handleAddAgent} />
                    </div>
                    <div data-tutorial="tool-manager">
                        <ToolManager agents={agents} onUpdateAgentTools={handleUpdateAgentTools} />
                    </div>
                    <SwarmManager agents={agents} swarms={swarms} onAddSwarm={handleAddSwarm} />
                </div>

                <div className="ide-main-view">
                    <div data-tutorial="workspace-selector">
                        <TargetWorkspaceSelector workspacePath={workspacePath} onChangeWorkspace={setWorkspacePath} />
                    </div>

                    {workspacePath && backups.length > 0 && (
                        <div className="registry-panel file-rollbacks-panel mb-3">
                            <h3 className="file-rollbacks-title">File Rollbacks (Backups)</h3>
                            <div className="file-rollbacks-list">
                                {backups.map(b => (
                                    <div key={b.filename} className="registry-item d-flex justify-content-between align-items-center mb-1">
                                        <div className="rollback-filename">
                                            {b.filename}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-secondary rollback-btn"
                                            onClick={() => handleRestoreBackup(b.filename)}
                                        >
                                            Rollback
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div data-tutorial="global-dispatcher">
                        <GlobalDispatcher
                            agents={agents}
                            swarms={swarms}
                            onDispatch={handleDispatch}
                            approvalQueue={approvalQueue}
                            onResolveAction={handleApprovalResolve}
                        />
                    </div>

                    {activeEditorFile && (
                        <div className="monaco-pane mb-4 p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h4 className="vscode-viewer-title">VS Code Viewer: {activeEditorFile.name}</h4>
                                <button className="btn btn-sm btn-close-editor" onClick={() => setActiveEditorFile(null)}>Close</button>
                            </div>
                            <CodeEditor
                                value={activeEditorFile.content}
                                readOnly={activeEditorFile.readOnly}
                                language={activeEditorFile.name.endsWith('.ts') || activeEditorFile.name.endsWith('.tsx') ? 'typescript' : 'javascript'}
                            />
                        </div>
                    )}

                    {result && <pre className="result-output mb-4">{JSON.stringify(result, null, 2)}</pre>}
                    <ServiceMonitor agents={agents} workspacePath={workspacePath} coherence={coherence} fracturedVirtues={fracturedVirtues} onInjectIntervention={handleInjectIntervention} onDistillTensors={handleDistillTensors} />
                </div>
            </div>
        </div>
    );
}
