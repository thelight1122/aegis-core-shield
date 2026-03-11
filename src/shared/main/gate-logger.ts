// src/shared/main/gate-logger.ts
// Purpose: Append-only logging infrastructure for Discernment Gate evaluations
// Persistent file-based logging with structured JSON entries, known as the PEER Tensor.
// Adheres to AEGIS append-only axiom – logs never deleted, only appended

import * as fs from 'fs';
import * as path from 'path';

export interface GateLogEntry {
    event?: 'PEER_CAPTURE' | 'GATE_OUTCOME'; // I-04: Distinguish early capture from outcome
    timestamp: string;              // ISO 8601
    promptHash: string;             // cryptographic hash of prompt
    raw?: string;                   // I-04: Preserved raw input for PEER capture
    integrity?: 0 | 1;               // binary gate evaluation
    admitted?: boolean;              // true if passed, false if returned
    virtueScores?: Record<string, number>;  // adjusted scores (if returned)
    returnPacket?: any;             // full packet (if returned)
    logLevel: 'info' | 'warning' | 'error';
}

// Default log directory – can be overridden via environment
const LOG_DIR = process.env.AEGIS_LOG_DIR || path.join(process.cwd(), 'data', 'gate-logs');
const LOG_FILE = path.join(LOG_DIR, 'discernment-gate.jsonl');

/**
 * Initialize logging infrastructure
 * Creates log directory and file if they don't exist
 */
export function initGateLogger(): void {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        if (!fs.existsSync(LOG_FILE)) {
            fs.writeFileSync(LOG_FILE, '', 'utf8');
        }
    } catch (error) {
        console.error('[Gate Logger] Failed to initialize logging infrastructure:', error);
        // Non-blocking – gate can still function without logging
    }
}

/**
 * Append gate evaluation to persistent log (PEER Tensor)
 * Never overwrites or deletes – append-only
 */
export function logGateEvaluation(entry: GateLogEntry): void {
    try {
        const fullEntry = {
            event: entry.event || 'GATE_OUTCOME',
            ...entry
        };
        const logLine = JSON.stringify(fullEntry) + '\n';
        fs.appendFileSync(LOG_FILE, logLine, 'utf8');
    } catch (error) {
        console.error('[Gate Logger] Failed to append log entry:', error);
        console.error('[Gate Logger] Entry was:', entry);
    }
}

/**
 * Read recent log entries (for debugging or audit)
 * @param limit - maximum number of recent entries to read
 * @returns array of log entries, newest first
 */
export function readRecentLogs(limit: number = 100): GateLogEntry[] {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return [];
        }
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);
        const entries = lines
            .slice(-limit)
            .map(line => {
                try {
                    return JSON.parse(line) as GateLogEntry;
                } catch {
                    return null;
                }
            })
            .filter(entry => entry !== null) as GateLogEntry[];

        return entries.reverse(); // newest first
    } catch (error) {
        console.error('[Gate Logger] Failed to read logs:', error);
        return [];
    }
}

/**
 * Get total log entry count (for stats/monitoring)
 */
export function getLogEntryCount(): number {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return 0;
        }
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);
        return lines.length;
    } catch (error) {
        console.error('[Gate Logger] Failed to count log entries:', error);
        return 0;
    }
}
