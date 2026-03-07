import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { pruneOldBackups } from '../backup-pruner';

let db: Database.Database | null = null;

export function initDatabase(workspacePath: string) {
    const aegisDir = path.join(workspacePath, '.aegis');
    if (!fs.existsSync(aegisDir)) {
        fs.mkdirSync(aegisDir, { recursive: true });
    }

    const dbPath = path.join(aegisDir, 'aegis_vault.db');
    db = new Database(dbPath);

    // Prune old backups on init
    pruneOldBackups(workspacePath);

    // Initial schema setup
    db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            role TEXT,
            status TEXT,
            tools_json TEXT
        );

        CREATE TABLE IF NOT EXISTS dataquad_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT,
            tensor_type TEXT, -- context, affect, memory, learning
            timestamp TEXT,
            content TEXT,
            sequence_json TEXT, -- for reflection data
            FOREIGN KEY(agent_id) REFERENCES agents(id)
        );
    `);
}

export function getDb() {
    if (!db) throw new Error('Database not initialized. Call initDatabase(workspacePath) first.');
    return db as any;
}

export function saveAgentToDb(agent: any) {
    const database = getDb();

    // 1. Upsert Agent
    const upsertAgent = database.prepare(`
        INSERT INTO agents (id, name, role, status, tools_json)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            role=excluded.role,
            status=excluded.status,
            tools_json=excluded.tools_json
    `);

    upsertAgent.run(
        agent.id,
        agent.name,
        agent.role,
        agent.status,
        JSON.stringify(agent.tools || [])
    );

    // 2. Clear existing entries for this agent (or implement append-only logic better)
    // For a true "Production" version, we might want to only append new entries
    // But for simplicity of conversion, we'll clear and re-insert the latest quad window
    database.prepare('DELETE FROM dataquad_entries WHERE agent_id = ?').run(agent.id);

    const insertEntry = database.prepare(`
        INSERT INTO dataquad_entries (agent_id, tensor_type, timestamp, content, sequence_json)
        VALUES (?, ?, ?, ?, ?)
    `);

    const insertTensor = (type: string, entries: any[]) => {
        for (const entry of entries) {
            insertEntry.run(
                agent.id,
                type,
                entry.timestamp,
                entry.content,
                entry.sequenceData ? JSON.stringify(entry.sequenceData) : null
            );
        }
    };

    insertTensor('context', agent.dataQuad.context);
    insertTensor('affect', agent.dataQuad.affect);
    insertTensor('memory', agent.dataQuad.memory);
    insertTensor('learning', agent.dataQuad.learning);
}

export function loadAgentFromDb(agentId: string) {
    const database = getDb();

    const agentRow = database.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
    if (!agentRow) return null;

    const entries = database.prepare('SELECT * FROM dataquad_entries WHERE agent_id = ?').all(agentId) as any[];

    const agent: any = {
        id: agentRow.id,
        name: agentRow.name,
        role: agentRow.role,
        status: agentRow.status,
        tools: JSON.parse(agentRow.tools_json),
        dataQuad: {
            context: [],
            affect: [],
            memory: [],
            learning: []
        }
    };

    for (const entry of entries) {
        const tensorEntry = {
            timestamp: entry.timestamp,
            content: entry.content,
            sequenceData: entry.sequence_json ? JSON.parse(entry.sequence_json) : undefined
        };
        (agent.dataQuad as any)[entry.tensor_type].push(tensorEntry);
    }

    return agent;
}

export function getSystemMetrics() {
    const database = getDb();

    const agentsRow = database.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
    const entriesRow = database.prepare('SELECT COUNT(*) as count FROM dataquad_entries').get() as { count: number };

    return {
        totalAgents: agentsRow.count,
        totalEntries: entriesRow.count
    };
}
