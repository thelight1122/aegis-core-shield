import { initDatabase, getDb } from './db/database';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const tempDir = path.join(os.tmpdir(), 'aegis-debug-' + Date.now());
console.log('Using tempDir:', tempDir);

try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    initDatabase(tempDir);
    console.log('Database initialized successfully.');
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables);
} catch (error) {
    console.error('Database initialization failed:', error);
} finally {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}
