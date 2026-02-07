// src/main/preload.ts
// Purpose: Expose safe IPC channels to renderer for gate + IDS flow
// Security: only expose processPrompt function

import { contextBridge, ipcRenderer } from 'electron';
import { processPrompt } from './ids';

contextBridge.exposeInMainWorld('aegisAPI', {
  processPrompt: (prompt: string) => processPrompt(prompt)
});