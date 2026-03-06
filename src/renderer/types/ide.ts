import { ReflectionSequence } from '../../shared/main/reflection-engine';

export interface MemoryEntry {
    timestamp: string;
    content: string;
    type?: 'reflection';
    sequenceData?: ReflectionSequence;
}

export interface DataQuad {
    context: MemoryEntry[];
    affect: MemoryEntry[];
    memory: MemoryEntry[];
    learning: MemoryEntry[];
}

export interface AegisAgent {
    id: string;
    name: string;
    role: string;
    status: 'idle' | 'active' | 'reflecting' | 'error';
    dataQuad: DataQuad;
}

export interface SwarmTopology {
    type: 'round-robin' | 'hierarchical';
    leadAgentId?: string; // Used if hierarchical
    memberIds: string[];
}

export interface AegisSwarm {
    id: string;
    name: string;
    objective: string;
    status: 'idle' | 'deploying' | 'executing' | 'halted_coercion' | 'completed';
    topology: SwarmTopology;
    sharedContext: MemoryEntry[];
}

export const createDefaultQuad = (initialMem: string): DataQuad => ({
    context: [],
    affect: [{ timestamp: new Date().toISOString(), content: 'Coherence nominal' }],
    memory: [{ timestamp: new Date().toISOString(), content: initialMem }],
    learning: []
});

declare global {
    interface Window {
        aegisAPI: {
            processPrompt: (prompt: string) => Promise<any>;
            fetchStewardLogs: (limit?: number) => Promise<any>;
            selectWorkspace: () => Promise<string | null>;
            readWorkspaceFile: (workspacePath: string, relativePath: string) => Promise<{ content?: string; error?: string }>;
            saveAgent: (workspacePath: string, agentId: string, agentData: AegisAgent) => Promise<boolean>;
            loadAgent: (workspacePath: string, agentId: string) => Promise<AegisAgent | null>;
        };
    }
}
