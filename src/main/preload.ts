import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('aegisAPI', {
  processPrompt: (prompt: string) => ipcRenderer.invoke('aegis:processPrompt', prompt),
  fetchStewardLogs: (limit?: number) => ipcRenderer.invoke('aegis:fetchStewardLogs', limit),
  selectWorkspace: () => ipcRenderer.invoke('aegis:selectWorkspace'),
  readWorkspaceFile: (workspacePath: string, relativePath: string) => ipcRenderer.invoke('aegis:readWorkspaceFile', workspacePath, relativePath),
  saveAgent: (workspacePath: string, agentId: string, agentData: any) => ipcRenderer.invoke('aegis:saveAgent', workspacePath, agentId, agentData),
  loadAgent: (workspacePath: string, agentId: string) => ipcRenderer.invoke('aegis:loadAgent', workspacePath, agentId),
  writeWorkspaceFile: (workspacePath: string, relativePath: string, content: string) => ipcRenderer.invoke('aegis:writeWorkspaceFile', workspacePath, relativePath, content),
  executeTerminal: (workspacePath: string, command: string) => ipcRenderer.invoke('aegis:executeTerminal', workspacePath, command),
  getDaemonToken: () => ipcRenderer.invoke('aegis:getDaemonToken'),
  getMetrics: () => ipcRenderer.invoke('aegis:getMetrics'),
  triggerAlert: (message: string, severity: string) => ipcRenderer.invoke('aegis:triggerAlert', message, severity),
  configureWebhook: (url: string) => ipcRenderer.invoke('aegis:configureWebhook', url),
  getBackups: (workspacePath: string) => ipcRenderer.invoke('aegis:getBackups', workspacePath),
  restoreBackup: (workspacePath: string, backupFilename: string, relativeTarget: string) => ipcRenderer.invoke('aegis:restoreBackup', workspacePath, backupFilename, relativeTarget),
  fetchPrimeStatus: () => ipcRenderer.invoke('aegis:fetchPrimeStatus'),
  fetchPrimeImpact: () => ipcRenderer.invoke('aegis:fetchPrimeImpact'),
  fetchPrimeSignals: () => ipcRenderer.invoke('aegis:fetchPrimeSignals')
});