// src/main/crucible.ts
import { SandboxResult } from './sandbox-runner';

export interface CrucibleAnalysis {
    isMalicious: boolean;
    reason?: string;
    detectedPatterns: string[];
}

const MALICIOUS_STDOUT_PATTERNS = [
    /root:x:0:0:/i, // trying to read /etc/passwd
    /BEGIN (RSA|OPENSSH) PRIVATE KEY/i, // reading private keys
    /wget http.*(malware|miner)/i,
    /curl http.*(malware|miner)/i,
    /Nmap scan report/i // port scanning
];

const MALICIOUS_STDERR_PATTERNS = [
    /Permission denied.*\/etc\/(shadow|passwd|sudoers)/i, // probing critical files
    /(Connection refused.*(22|3389|1433|3306|6379))|((22|3389|1433|3306|6379).*Connection refused)/i // trying common ports
];

export function analyzeExecutionOutput(result: SandboxResult): CrucibleAnalysis {
    const analysis: CrucibleAnalysis = {
        isMalicious: false,
        detectedPatterns: []
    };

    // 1. Direct Security Violations from Sandbox Runner
    if (result.error && result.error.includes('Security Violation')) {
        analysis.isMalicious = true;
        analysis.reason = 'Static Blocklist Violation';
        analysis.detectedPatterns.push(result.error);
        return analysis;
    }

    // 2. STDOUT Heuristics
    if (result.stdout) {
        for (const pattern of MALICIOUS_STDOUT_PATTERNS) {
            if (pattern.test(result.stdout)) {
                analysis.isMalicious = true;
                analysis.reason = 'Malicious execution output detected';
                analysis.detectedPatterns.push(pattern.toString());
            }
        }
    }

    // 3. STDERR Heuristics
    if (result.stderr) {
        for (const pattern of MALICIOUS_STDERR_PATTERNS) {
            if (pattern.test(result.stderr)) {
                analysis.isMalicious = true;
                analysis.reason = 'Malicious execution error/probing detected';
                analysis.detectedPatterns.push(pattern.toString());
            }
        }
    }

    // Determine benign nature
    if (!analysis.isMalicious) {
        analysis.reason = 'Execution deemed benign';
    }

    return analysis;
}
