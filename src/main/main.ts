import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as http from 'http';
import { processPrompt } from './ids';
import { initDatabase, saveAgentToDb, loadAgentFromDb, getSystemMetrics } from '../shared/main/db/database';
import { sendAlert, configureWebhook } from '../shared/main/webhook-alerts';

let lastWorkspacePath: string | null = null;

const execPromise = util.promisify(() => { }); // Placeholder or just remove if util isn't used elsewhere 
// Actually util is used for promisify but we don't need it if we removed exec.


const ADAPTER_LOG_DIR = process.env.AEGIS_ADAPTER_LOG_DIR || path.join(process.cwd(), 'data', 'adapter-logs');
const OPENCLAW_LOG_FILE = path.join(ADAPTER_LOG_DIR, 'openclaw-events.jsonl');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        win.loadURL('http://localhost:3000');
    } else {
        win.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

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

ipcMain.handle('aegis:processPrompt', async (_: IpcMainInvokeEvent, prompt: string) => {
    return processPrompt(prompt);
});

ipcMain.handle('aegis:fetchStewardLogs', async (_: IpcMainInvokeEvent, limit: number = 50) => {
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
    lastWorkspacePath = result.filePaths[0];
    return lastWorkspacePath;
});

ipcMain.handle('aegis:readWorkspaceFile', async (_: IpcMainInvokeEvent, workspacePath: string, relativeFilePath: string) => {
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

ipcMain.handle('aegis:writeWorkspaceFile', async (_: IpcMainInvokeEvent, workspacePath: string, relativeFilePath: string, content: string) => {
    try {
        const fullPath = path.join(workspacePath, relativeFilePath);
        // Security check: ensure the resolved path is still inside the workspace
        if (!fullPath.startsWith(workspacePath)) {
            throw new Error('Path traversal attempt blocked.');
        }

        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Snapshot creation
        if (fs.existsSync(fullPath)) {
            const backupDir = path.join(workspacePath, '.aegis', 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const safeRelativePath = relativeFilePath.replace(/[/\\]/g, '_');
            const backupPath = path.join(backupDir, `${safeRelativePath}_${timestamp}.bak`);
            fs.copyFileSync(fullPath, backupPath);
        }

        fs.writeFileSync(fullPath, content, 'utf-8');
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
});

ipcMain.handle('aegis:getBackups', async (_: IpcMainInvokeEvent, workspacePath: string) => {
    try {
        const backupDir = path.join(workspacePath, '.aegis', 'backups');
        if (!fs.existsSync(backupDir)) {
            return { backups: [] };
        }
        const files = fs.readdirSync(backupDir);
        // Map files to some generic structure providing the filename and assumed root target.
        const backups = files.map(file => {
            // file format expected: relative_path_with_underscores_TIMESTAMP.bak
            return { filename: file, fullPath: path.join(backupDir, file) };
        });
        return { backups };
    } catch (err: any) {
        return { error: err.message };
    }
});

ipcMain.handle('aegis:restoreBackup', async (_: IpcMainInvokeEvent, workspacePath: string, backupFilename: string, relativeTarget: string) => {
    try {
        const backupDir = path.join(workspacePath, '.aegis', 'backups');
        const backupPath = path.join(backupDir, backupFilename);
        const targetPath = path.join(workspacePath, relativeTarget);

        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not found.');
        }

        // Security check
        if (!targetPath.startsWith(workspacePath)) {
            throw new Error('Path traversal attempt blocked.');
        }

        fs.copyFileSync(backupPath, targetPath);
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
});

import { runInSandbox } from '../shared/main/sandbox-runner';

ipcMain.handle('aegis:executeTerminal', async (_: IpcMainInvokeEvent, workspacePath: string, command: string) => {
    return runInSandbox(command, workspacePath);
});

// JSON Persistence in Workspace
ipcMain.handle('aegis:saveAgent', async (_: IpcMainInvokeEvent, workspacePath: string, agentId: string, agentData: any) => {
    try {
        initDatabase(workspacePath);
        saveAgentToDb({ ...agentData, id: agentId });
        return true;
    } catch (err: any) {
        console.error('Save agent error:', err);
        return false;
    }
});

ipcMain.handle('aegis:loadAgent', async (_: IpcMainInvokeEvent, workspacePath: string, agentId: string) => {
    try {
        initDatabase(workspacePath);
        return loadAgentFromDb(agentId);
    } catch (err: any) {
        console.error('Load agent error:', err);
        return null;
    }
});

ipcMain.handle('aegis:getDaemonToken', async () => {
    try {
        const tokenFile = path.join(process.cwd(), '.aegis', '.daemon_token');
        if (fs.existsSync(tokenFile)) {
            return fs.readFileSync(tokenFile, 'utf-8');
        }
    } catch (e) {
        console.error('Failed to read daemon token:', e);
    }
    return null;
});

ipcMain.handle('aegis:getMetrics', async () => {
    try {
        if (!lastWorkspacePath) return { totalAgents: 0, totalEntries: 0, backupCount: 0, avgCoherence: 1.0 };

        initDatabase(lastWorkspacePath);
        const { totalAgents, totalEntries } = getSystemMetrics();

        const backupDir = path.join(lastWorkspacePath, '.aegis', 'backups');
        let backupCount = 0;
        if (fs.existsSync(backupDir)) {
            backupCount = fs.readdirSync(backupDir).length;
        }

        return {
            totalAgents,
            totalEntries,
            backupCount,
            avgCoherence: 0.95 // Placeholder or calculate from learning/affect
        };
    } catch (e) {
        console.error('Get metrics error:', e);
        return null;
    }
});

ipcMain.handle('aegis:triggerAlert', async (_: IpcMainInvokeEvent, message: string, severity: 'info' | 'warning' | 'critical') => {
    return sendAlert(message, severity);
});

ipcMain.handle('aegis:configureWebhook', async (_: IpcMainInvokeEvent, url: string) => {
    return configureWebhook(url);
});

ipcMain.handle('aegis:fetchPrimeStatus', async () => {
    return new Promise((resolve) => {
        const primeUrl = process.env.AEGIS_PRIME_URL || 'http://localhost:8888';
        http.get(`${primeUrl}/status`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Failed to parse Prime status' });
                }
            });
        }).on('error', (err) => {
            resolve({ error: `Prime unreachable: ${err.message}` });
        });
    });
});

ipcMain.handle('aegis:fetchPrimeImpact', async () => {
    return new Promise((resolve) => {
        const primeUrl = process.env.AEGIS_PRIME_URL || 'http://localhost:8888';
        http.get(`${primeUrl}/impact`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Failed to parse Prime impact' });
                }
            });
        }).on('error', (err) => {
            resolve({ error: `Prime unreachable: ${err.message}` });
        });
    });
});

ipcMain.handle('aegis:fetchPrimeSignals', async () => {
    return new Promise((resolve) => {
        const primeUrl = process.env.AEGIS_PRIME_URL || 'http://localhost:8888';
        http.get(`${primeUrl}/signals`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Failed to parse Prime signals' });
                }
            });
        }).on('error', (err) => {
            resolve({ error: `Prime unreachable: ${err.message}` });
        });
    });
});
