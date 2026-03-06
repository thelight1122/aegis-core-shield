export interface IAegisAPI {
    processPrompt: (prompt: string) => Promise<any>;
    fetchStewardLogs: (limit?: number) => Promise<any[]>;
}

declare global {
    interface Window {
        aegisAPI: IAegisAPI;
    }
}
