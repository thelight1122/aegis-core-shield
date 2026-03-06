import React, { useState } from 'react';
import { processPrompt } from '../../shared/main/ids-processor';
import { ReturnPacket } from '../../shared/main/discernment-gate';
import { AegisAgent, AegisSwarm, createDefaultQuad } from '../types/ide';

import TargetWorkspaceSelector from './TargetWorkspaceSelector';
import AgentRegistry from './AgentRegistry';
import SwarmManager from './SwarmManager';
import GlobalDispatcher from './GlobalDispatcher';
import ServiceMonitor from './ServiceMonitor';

const DEFAULT_AGENTS: AegisAgent[] = [
    {
        id: 'custodian-1',
        name: 'Custodian Alpha',
        role: 'Custodian Agent',
        status: 'idle',
        dataQuad: createDefaultQuad('Integrity baseline initialized'),
    },
    {
        id: 'research-1',
        name: 'Research Beta',
        role: 'Research Agent',
        status: 'idle',
        dataQuad: createDefaultQuad('Context channel attached'),
    },
    {
        id: 'builder-1',
        name: 'Builder Gamma',
        role: 'Builder Agent',
        status: 'idle',
        dataQuad: createDefaultQuad('Toolchain profile loaded'),
    },
];

export default function AgenticIDE() {
    const [agents, setAgents] = useState<AegisAgent[]>(DEFAULT_AGENTS);
    const [swarms, setSwarms] = useState<AegisSwarm[]>([]);
    const [coherence, setCoherence] = useState(0);
    const [fracturedVirtues, setFracturedVirtues] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [workspacePath, setWorkspacePath] = useState<string | null>(null);

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

    const handleDispatch = async (targetId: string, type: 'agent' | 'swarm', prompt: string) => {
        let res: any;
        if (window.aegisAPI) {
            res = await window.aegisAPI.processPrompt(prompt);
        } else {
            res = processPrompt(prompt);
        }

        setResult(res);

        if (res && 'admitted' in res && res.admitted) {
            setCoherence(1.0);
            setFracturedVirtues([]);

            if (type === 'agent') {
                let contextMessage = 'Executing assigned task';
                let memoryMessage = 'Admitted gate flow';
                let fileContent = '';

                if (prompt.startsWith('!read ') && workspacePath) {
                    const filename = prompt.substring(6).trim();
                    const readResult = await window.aegisAPI?.readWorkspaceFile(workspacePath, filename);
                    if (readResult?.error) {
                        contextMessage = `Action Failed: Could not read ${filename}`;
                        memoryMessage = `fs-reader error: ${readResult.error}`;
                    } else if (readResult?.content) {
                        contextMessage = `Action Success: Read ${filename}`;
                        memoryMessage = `fs-reader executed on ${filename}`;
                        fileContent = readResult.content.substring(0, 1000) + (readResult.content.length > 1000 ? '\n...[TRUNCATED]' : '');
                    }
                } else if (prompt.startsWith('!read ') && !workspacePath) {
                    contextMessage = 'Action Failed: No Target Workspace selected';
                    memoryMessage = 'fs-reader blocked: Missing workspace';
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

    return (
        <div className="agentic-ide-fullscreen">
            <div className="ide-layout-grid">
                <div className="ide-sidebar">
                    <AgentRegistry agents={agents} onAddAgent={handleAddAgent} />
                    <SwarmManager agents={agents} swarms={swarms} onAddSwarm={handleAddSwarm} />
                </div>

                <div className="ide-main-view">
                    <TargetWorkspaceSelector workspacePath={workspacePath} onChangeWorkspace={setWorkspacePath} />
                    <GlobalDispatcher agents={agents} swarms={swarms} onDispatch={handleDispatch} />
                    {result && <pre className="result-output mb-4">{JSON.stringify(result, null, 2)}</pre>}
                    <ServiceMonitor agents={agents} coherence={coherence} fracturedVirtues={fracturedVirtues} />
                </div>
            </div>
        </div>
    );
}
