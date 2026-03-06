// src/main/preload.ts
// Purpose: Expose safe IPC channels to renderer for gate + IDS flow
// Security: only expose processPrompt function

import { ipcRenderer } from 'electron';
import { processPrompt } from './ids';

(window as any).aegisAPI = {
  processPrompt: (prompt: string) => processPrompt(prompt),
  fetchStewardLogs: (limit?: number) => ipcRenderer.invoke('aegis:fetchStewardLogs', limit),
  selectWorkspace: () => ipcRenderer.invoke('aegis:selectWorkspace'),
  readWorkspaceFile: (workspacePath: string, relativePath: string) => ipcRenderer.invoke('aegis:readWorkspaceFile', workspacePath, relativePath),
  saveAgent: (workspacePath: string, agentId: string, agentData: any) => ipcRenderer.invoke('aegis:saveAgent', workspacePath, agentId, agentData),
  loadAgent: (workspacePath: string, agentId: string) => ipcRenderer.invoke('aegis:loadAgent', workspacePath, agentId)
};