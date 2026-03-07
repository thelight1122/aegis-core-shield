export interface IAegisAPI {
    processPrompt: (prompt: string) => Promise<any>;
    fetchStewardLogs: (limit?: number) => Promise<any[]>;
    fetchPrimeStatus: () => Promise<any>;
    fetchPrimeImpact: () => Promise<any>;
    fetchPrimeSignals: () => Promise<any>;
}

declare global {
    interface Window {
        aegisAPI: IAegisAPI;
    }
}
