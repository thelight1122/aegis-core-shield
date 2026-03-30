import { ReflectionSequence } from '../../shared/main/reflection-engine';

export interface MemoryEntry {
    timestamp: string;
    content: string;
    type?: 'reflection';
    sequenceData?: ReflectionSequence;
}

export interface PendingAction {
    id: string;
    agentId: string;
    type: 'write' | 'execute';
    payload: any;
    filename?: string;
    originalContent?: string;
}

export interface DataQuad {
    context: MemoryEntry[];
    affect: MemoryEntry[];
    memory: MemoryEntry[];
    learning: MemoryEntry[];
}

export interface AegisTool {
    id: string;
    name: string;
    description: string;
    restricted: boolean;
}

export interface AegisAgent {
    id: string;
    name: string;
    role: string;
    status: 'idle' | 'active' | 'reflecting' | 'awaiting-approval' | 'error';
    tools: AegisTool[];
    dataQuad: DataQuad;
}

export interface SwarmTopology {
    type: 'round-robin' | 'hierarchical' | 'consensus';
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
            fetchCoreHealth: () => Promise<any>;
            fetchCoreSessions: () => Promise<any>;
            fetchCoreSessionSummary: (sessionId: string) => Promise<any>;
            seedCoreSession: (sessionId?: string) => Promise<any>;
            runCoreScan: (sessionId: string, signal?: string) => Promise<any>;
            appendCorePeer: (sessionId: string, presentState: unknown) => Promise<any>;
            appendCorePCT: (sessionId: string, workingContext: unknown, retrievedRecordIds?: string[]) => Promise<any>;
            writeCoreSpine: (sessionId: string, pattern: string, invariant?: boolean) => Promise<any>;
            fetchPrimeStatus: () => Promise<any>;
            fetchPrimeImpact: () => Promise<any>;
            fetchPrimeSignals: () => Promise<any>;
            selectWorkspace: () => Promise<string | null>;
            readWorkspaceFile: (workspacePath: string, relativePath: string) => Promise<{ content?: string; error?: string }>;
            saveAgent: (workspacePath: string, agentId: string, agentData: AegisAgent) => Promise<boolean>;
            loadAgent: (workspacePath: string, agentId: string) => Promise<AegisAgent | null>;
            writeWorkspaceFile: (workspacePath: string, relativePath: string, content: string) => Promise<{ success?: boolean; error?: string }>;
            executeTerminal: (workspacePath: string, command: string) => Promise<{ stdout?: string; stderr?: string; error?: string }>;
            getDaemonToken: () => Promise<string | null>;
            getMetrics: () => Promise<any>;
            triggerAlert: (message: string, severity: 'info' | 'warning' | 'critical') => Promise<void>;
            configureWebhook: (url: string) => Promise<void>;
            getBackups: (workspacePath: string) => Promise<{ backups?: { filename: string, fullPath: string }[], error?: string }>;
            restoreBackup: (workspacePath: string, backupFilename: string, relativeTarget: string) => Promise<{ success?: boolean; error?: string }>;
        };
    }
}
