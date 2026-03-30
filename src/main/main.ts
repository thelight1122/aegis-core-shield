import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as http from 'http';
import * as https from 'https';
import { execFile } from 'child_process';
import { processPrompt } from './ids';
import { initDatabase, saveAgentToDb, loadAgentFromDb, getSystemMetrics } from '../shared/main/db/database';
import { sendAlert, configureWebhook } from '../shared/main/webhook-alerts';

let lastWorkspacePath: string | null = null;

const execFileAsync = util.promisify(execFile);


const ADAPTER_LOG_DIR = process.env.AEGIS_ADAPTER_LOG_DIR || path.join(process.cwd(), 'data', 'adapter-logs');
const OPENCLAW_LOG_FILE = path.join(ADAPTER_LOG_DIR, 'openclaw-events.jsonl');
const DEFAULT_CORE_URL = process.env.AEGIS_CORE_URL || 'https://aegiscustodianhandshake-730882928549.us-west1.run.app';

type CoreRequestOptions = {
    method?: 'GET' | 'POST';
    body?: unknown;
};

let cachedIdentityToken: { value: string; expiresAt: number } | null = null;

function isLocalCoreUrl(url: URL) {
    return ['127.0.0.1', 'localhost'].includes(url.hostname);
}

async function getCoreAuthHeaders(targetUrl: URL) {
    if (isLocalCoreUrl(targetUrl)) {
        return {};
    }

    const presetToken = process.env.AEGIS_CORE_IDENTITY_TOKEN;
    if (presetToken) {
        return { Authorization: `Bearer ${presetToken}` };
    }

    if (cachedIdentityToken && cachedIdentityToken.expiresAt > Date.now()) {
        return { Authorization: `Bearer ${cachedIdentityToken.value}` };
    }

    try {
        const { stdout } = await execFileAsync('gcloud', ['auth', 'print-identity-token']);
        const token = stdout.trim();
        if (!token) {
            throw new Error('No identity token returned by gcloud.');
        }
        cachedIdentityToken = {
            value: token,
            expiresAt: Date.now() + 5 * 60 * 1000
        };
        return { Authorization: `Bearer ${token}` };
    } catch (error: any) {
        throw new Error(`Unable to acquire Core service identity token. Start the Cloud Run proxy or sign in with gcloud. ${error.message}`);
    }
}

async function coreRequest(routePath: string, options: CoreRequestOptions = {}) {
    const targetUrl = new URL(routePath, DEFAULT_CORE_URL.endsWith('/') ? DEFAULT_CORE_URL : `${DEFAULT_CORE_URL}/`);
    const headers = await getCoreAuthHeaders(targetUrl);
    const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
    const client = targetUrl.protocol === 'https:' ? https : http;

    return new Promise<any>((resolve, reject) => {
        const req = client.request(targetUrl, {
            method: options.method || 'GET',
            headers: {
                Accept: 'application/json',
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const statusCode = res.statusCode || 500;
                const parsed = data.length > 0 ? (() => {
                    try {
                        return JSON.parse(data);
                    } catch {
                        return { ok: false, error: data };
                    }
                })() : {};

                if (statusCode >= 400) {
                    reject(new Error(typeof parsed?.error === 'string' ? parsed.error : `Core request failed with status ${statusCode}`));
                    return;
                }

                resolve(parsed);
            });
        });

        req.on('error', reject);
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

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

// Single Instance Lock (Fixes "Access is denied" cache error)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            if (windows[0].isMinimized()) windows[0].restore();
            windows[0].focus();
        }
    });

    app.whenReady().then(() => {
        // Set Content Security Policy (resolves Electron security warning)
        const { session } = require('electron');
        session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' http://localhost:3000 http://localhost:8888; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"]
                }
            });
        });
        createWindow();
    });
}

// app.whenReady is handled above within the single-instance lock logic

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

ipcMain.handle('aegis:fetchCoreHealth', async () => {
    try {
        return await coreRequest('/health');
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
});

ipcMain.handle('aegis:fetchCoreSessions', async () => {
    try {
        return await coreRequest('/sessions');
    } catch (error: any) {
        return { ok: false, error: error.message, sessions: [] };
    }
});

ipcMain.handle('aegis:fetchCoreSessionSummary', async (_: IpcMainInvokeEvent, sessionId: string) => {
    try {
        return await coreRequest(`/session-summary/${encodeURIComponent(sessionId)}`);
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
});

ipcMain.handle('aegis:seedCoreSession', async (_: IpcMainInvokeEvent, sessionId?: string) => {
    try {
        return await coreRequest('/seed', {
            method: 'POST',
            body: sessionId ? { sessionId } : {}
        });
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
});

ipcMain.handle('aegis:runCoreScan', async (_: IpcMainInvokeEvent, sessionId: string, signal?: string) => {
    try {
        return await coreRequest('/scan', {
            method: 'POST',
            body: {
                sessionId,
                signal: signal || 'Assess current session state for continuity and drift.'
            }
        });
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
});

ipcMain.handle('aegis:appendCorePeer', async (_: IpcMainInvokeEvent, sessionId: string, presentState: unknown) => {
    try {
        return await coreRequest('/append-peer', {
            method: 'POST',
            body: {
                sessionId,
                presentState
            }
        });
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
});

ipcMain.handle('aegis:appendCorePCT', async (_: IpcMainInvokeEvent, sessionId: string, workingContext: unknown, retrievedRecordIds?: string[]) => {
    try {
        return await coreRequest('/append-pct', {
            method: 'POST',
            body: {
                sessionId,
                workingContext,
                ...(retrievedRecordIds && retrievedRecordIds.length > 0 ? { retrievedRecordIds } : {})
            }
        });
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
});

ipcMain.handle('aegis:writeCoreSpine', async (_: IpcMainInvokeEvent, sessionId: string, pattern: string, invariant?: boolean) => {
    try {
        return await coreRequest('/write-spine', {
            method: 'POST',
            body: {
                sessionId,
                pattern,
                invariant: invariant ?? true
            }
        });
    } catch (error: any) {
        return { ok: false, error: error.message };
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
