import { getDb } from './db/database';

export const MAX_CONTEXT_ITEMS = 50; // Threshold for automatic distillation

/**
 * Scans all agents in the database and prunes/summarizes their tensors if they exceed the threshold.
 */
export function runAutoDistillation() {
    try {
        const db = getDb();
        const agents = db.prepare('SELECT id FROM agents').all() as { id: string }[];

        for (const agent of agents) {
            distillTensor(agent.id, 'context');
            distillTensor(agent.id, 'memory');
        }
    } catch (e) {
        console.error('[AEGIS Auto-Distill] Error during background distillation:', e);
    }
}

function distillTensor(agentId: string, type: string) {
    const db = getDb();
    const entries = db.prepare('SELECT * FROM dataquad_entries WHERE agent_id = ? AND tensor_type = ? ORDER BY timestamp ASC').all(agentId, type) as any[];

    if (entries.length > MAX_CONTEXT_ITEMS) {
        console.log(`[AEGIS Auto-Distill] Compressing ${type} for ${agentId} (${entries.length} -> 10)`);

        const toKeep = entries.slice(-10);
        const toDistill = entries.slice(0, entries.length - 10);

        // Build a distilled summary entry
        const summaryContent = `[SYSTEM AUTO-DISTILLATION]: Condensed ${toDistill.length} earlier records. Summary: ${toDistill[0].content.substring(0, 50)}... [truncated]`;

        const deleteStmt = db.prepare('DELETE FROM dataquad_entries WHERE id = ?');
        const insertStmt = db.prepare('INSERT INTO dataquad_entries (agent_id, tensor_type, timestamp, content) VALUES (?, ?, ?, ?)');

        // Run as transaction for atomicity
        const distillTransaction = db.transaction(() => {
            for (const entry of toDistill) {
                deleteStmt.run(entry.id);
            }
            // Insert the summary at the start of the kept sequence or as a new early entry
            insertStmt.run(agentId, type, new Date().toISOString(), summaryContent);
        });

        distillTransaction();
    }
}
