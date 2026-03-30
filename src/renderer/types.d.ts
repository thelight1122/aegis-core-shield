export interface IAegisAPI {
    processPrompt: (prompt: string) => Promise<any>;
    fetchStewardLogs: (limit?: number) => Promise<any[]>;
    fetchCoreHealth: () => Promise<any>;
    fetchCoreSessions: () => Promise<any>;
    fetchCoreSessionSummary: (sessionId: string) => Promise<any>;
    seedCoreSession: (sessionId?: string) => Promise<any>;
    runCoreScan: (sessionId: string, signal?: string) => Promise<any>;
    fetchPrimeStatus: () => Promise<any>;
    fetchPrimeImpact: () => Promise<any>;
    fetchPrimeSignals: () => Promise<any>;
}

declare global {
    interface Window {
        aegisAPI: IAegisAPI;
    }
}
