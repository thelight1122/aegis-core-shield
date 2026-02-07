export interface IAegisAPI {
    processPrompt: (prompt: string) => Promise<any>;
}

declare global {
    interface Window {
        aegisAPI: IAegisAPI;
    }
}
