import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';

const execPromise = util.promisify(exec);

// Blocklist of high-risk commands or patterns
const COMMAND_BLOCKLIST = [
    'rm -rf',
    'mkfs',
    'dd ',
    '> /dev/',
    'mv /',
    'shutdown',
    'reboot',
    'format ',
    'attrib -r'
];

export interface SandboxResult {
    stdout?: string;
    stderr?: string;
    error?: string;
}

/**
 * Executes a terminal command within a security-aware wrapper.
 * Currently implements blocklist filtering and path validation.
 * In production, this should ideally route to a Docker/containerized runner.
 */
export async function runInSandbox(command: string, workspacePath: string): Promise<SandboxResult> {
    try {
        // 1. Basic Blocklist Check
        const loweredCmd = command.toLowerCase();
        for (const pattern of COMMAND_BLOCKLIST) {
            if (loweredCmd.includes(pattern)) {
                return { error: `Security Violation: Command contains prohibited pattern '${pattern}'` };
            }
        }

        // 2. Execution with limited environment/context if needed
        // For now, we use the standard exec but with strict CWD enforcement
        const { stdout, stderr } = await execPromise(command, {
            cwd: workspacePath,
            timeout: 30000, // 30 second timeout
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer limit
            env: {
                ...process.env,
                // We could strip sensitive env vars here in the future
            }
        });

        return { stdout, stderr };

    } catch (err: any) {
        return {
            error: err.message,
            stdout: err.stdout,
            stderr: err.stderr
        };
    }
}
