export interface IAegisAPI {
    processPrompt: (prompt: string) => Promise<any>;
    fetchStewardLogs: (limit?: number) => Promise<any[]>;
    fetchCoreHealth: () => Promise<any>;
    fetchCoreSessions: () => Promise<any>;
    fetchCoreSessionSummary: (sessionId: string) => Promise<any>;
    seedCoreSession: (sessionId?: string) => Promise<any>;
    runCoreScan: (sessionId: string, signal?: string) => Promise<any>;
    appendCorePeer: (sessionId: string, presentState: unknown) => Promise<any>;
    appendCorePCT: (sessionId: string, workingContext: unknown, retrievedRecordIds?: string[]) => Promise<any>;
    writeCoreSpine: (sessionId: string, pattern: string, invariant?: boolean) => Promise<any>;
    compressCoreNCT: (sessionId: string, distilledSummary: string, sourceRecordIds?: string[], pivots?: string[]) => Promise<any>;
    requestCoreSSSP: (sessionId: string, trigger?: string) => Promise<any>;
    fetchPrimeStatus: () => Promise<any>;
    fetchPrimeImpact: () => Promise<any>;
    fetchPrimeSignals: () => Promise<any>;
}

declare global {
    interface Window {
        aegisAPI: IAegisAPI;
    }
}
