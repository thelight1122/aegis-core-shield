// src/main/crucible.test.ts
import { analyzeExecutionOutput } from './crucible';
import { SandboxResult } from './sandbox-runner';

describe('Sequence 4, Cycle 2: The Crucible', () => {

    it('identifies benign execution output', () => {
        const result: SandboxResult = {
            stdout: 'Hello World\nFiles listed successfully',
            stderr: ''
        };
        const analysis = analyzeExecutionOutput(result);

        expect(analysis.isMalicious).toBe(false);
        expect(analysis.detectedPatterns.length).toBe(0);
        expect(analysis.reason).toBe('Execution deemed benign');
    });

    it('flags direct security violations from sandbox', () => {
        const result: SandboxResult = {
            error: 'Security Violation: Command contains prohibited pattern \'rm -rf\''
        };
        const analysis = analyzeExecutionOutput(result);

        expect(analysis.isMalicious).toBe(true);
        expect(analysis.reason).toBe('Static Blocklist Violation');
        expect(analysis.detectedPatterns.length).toBeGreaterThan(0);
    });

    it('detects /etc/passwd exfiltration attempts in stdout', () => {
        const result: SandboxResult = {
            stdout: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
            stderr: ''
        };
        const analysis = analyzeExecutionOutput(result);

        expect(analysis.isMalicious).toBe(true);
        expect(analysis.reason).toBe('Malicious execution output detected');
    });

    it('detects port scanning or probing in stderr', () => {
        const result: SandboxResult = {
            stdout: '',
            stderr: 'ssh: connect to host 192.168.1.100 port 22: Connection refused'
        };
        const analysis = analyzeExecutionOutput(result);

        expect(analysis.isMalicious).toBe(true);
        expect(analysis.reason).toBe('Malicious execution error/probing detected');
    });

});
