import * as fs from 'fs';
import * as path from 'path';

/**
 * Deletes backup files from the workspace that are older than the specified number of days.
 */
export function pruneOldBackups(workspacePath: string, maxAgeDays: number = 7) {
    try {
        const backupDir = path.join(workspacePath, '.aegis', 'backups');
        if (!fs.existsSync(backupDir)) return;

        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

        let prunedCount = 0;
        for (const file of files) {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
                prunedCount++;
            }
        }

        if (prunedCount > 0) {
            console.log(`[AEGIS Backup-Pruner] Automatically pruned ${prunedCount} old backup files in ${workspacePath}`);
        }
    } catch (e) {
        console.error('[AEGIS Backup-Pruner] Error during backup pruning:', e);
    }
}
