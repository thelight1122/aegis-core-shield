import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const ADAPTER_LOG_DIR = process.env.AEGIS_ADAPTER_LOG_DIR || path.join(process.cwd(), 'data', 'adapter-logs');
const OPENCLAW_LOG_FILE = path.join(ADAPTER_LOG_DIR, 'openclaw-events.jsonl');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer Console] ${message}`);
    });

    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Setup IPC
ipcMain.handle('aegis:fetchStewardLogs', async (_, limit: number = 50) => {
    try {
        if (!fs.existsSync(OPENCLAW_LOG_FILE)) {
            return [];
        }

        const content = fs.readFileSync(OPENCLAW_LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);

        // Take the last `limit` lines and parse them
        const recentLines = lines.slice(-limit);
        return recentLines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(Boolean).reverse(); // Reverse to get newest first
    } catch (error) {
        console.error('Failed to fetch steward logs:', error);
        return [];
    }
});

ipcMain.handle('aegis:selectWorkspace', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Target Workspace for AEGIS Agents'
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});

ipcMain.handle('aegis:readWorkspaceFile', async (_, workspacePath: string, relativeFilePath: string) => {
    try {
        const fullPath = path.join(workspacePath, relativeFilePath);
        // Security check: ensure the resolved path is still inside the workspace
        if (!fullPath.startsWith(workspacePath)) {
            throw new Error('Path traversal attempt blocked.');
        }
        if (!fs.existsSync(fullPath)) {
            return { error: 'File not found' };
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { content };
    } catch (err: any) {
        return { error: err.message };
    }
});

// JSON Persistence in Workspace
ipcMain.handle('aegis:saveAgent', async (_, workspacePath: string, agentId: string, agentData: any) => {
    try {
        const aegisDir = path.join(workspacePath, '.aegis', 'agents');
        if (!fs.existsSync(aegisDir)) {
            fs.mkdirSync(aegisDir, { recursive: true });
        }
        const filePath = path.join(aegisDir, `${agentId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(agentData, null, 2), 'utf-8');
        return true;
    } catch (err: any) {
        console.error('Save agent error:', err);
        return false;
    }
});

ipcMain.handle('aegis:loadAgent', async (_, workspacePath: string, agentId: string) => {
    try {
        const filePath = path.join(workspacePath, '.aegis', 'agents', `${agentId}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err: any) {
        console.error('Load agent error:', err);
        return null;
    }
});
