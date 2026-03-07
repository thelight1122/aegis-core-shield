import React, { useState, useEffect } from 'react';

interface CrucibleEntry {
    timestamp: string;
    prompt: string;
    source: string;
    analysis: {
        isMalicious: boolean;
        reason: string;
        detectedPatterns: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
    };
    execution: {
        exitCode: number | null;
        stdout: string;
        stderr: string;
        timedOut: boolean;
    };
}

export default function CrucibleLogs() {
    const [signals, setSignals] = useState<any[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        const fetch = async () => {
            if (window.aegisAPI?.fetchPrimeSignals) {
                const data = await window.aegisAPI.fetchPrimeSignals();
                if (Array.isArray(data)) {
                    setSignals(data);
                }
            }
        };
        fetch();
        const interval = setInterval(fetch, 5000);
        return () => clearInterval(interval);
    }, []);

    // Extract quarantine_end signals that have analysis payloads — these are Crucible results
    const crucibleEntries: CrucibleEntry[] = signals
        .filter(s => s.type === 'quarantine_end' && s.payload?.analysis)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(s => ({
            timestamp: s.timestamp,
            prompt: s.payload.prompt,
            source: s.source,
            analysis: s.payload.analysis,
            execution: s.payload.execution
        }));

    const getSeverityClass = (isMalicious: boolean, severity?: string) => {
        if (!isMalicious) return 'severity-clean';
        switch (severity) {
            case 'critical': return 'severity-critical';
            case 'high': return 'severity-high';
            case 'medium': return 'severity-medium';
            default: return 'severity-low';
        }
    };

    return (
        <div className="prime-card card-crucible">
            <h3>The Crucible <span className="live-indicator">• Behavioral Intelligence</span></h3>

            {crucibleEntries.length === 0 ? (
                <div className="crucible-empty">
                    <p>No sandbox analysis events recorded yet.</p>
                    <p className="dim-text">Crucible logs appear here after a quarantined prompt is evaluated.</p>
                </div>
            ) : (
                <div className="crucible-list">
                    {crucibleEntries.map((entry, idx) => (
                        <div
                            key={idx}
                            className={`crucible-entry ${getSeverityClass(entry.analysis.isMalicious, entry.analysis.severity)}`}
                            onClick={() => setExpanded(expanded === idx ? null : idx)}
                        >
                            <div className="crucible-summary">
                                <span className={`crucible-verdict ${entry.analysis.isMalicious ? 'malicious' : 'clean'}`}>
                                    {entry.analysis.isMalicious ? '⚠ MALICIOUS' : '✓ CLEARED'}
                                </span>
                                <span className="crucible-source">{entry.source}</span>
                                <span className="crucible-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                <span className="crucible-expand">{expanded === idx ? '▲' : '▼'}</span>
                            </div>

                            <div className="crucible-prompt">"{entry.prompt}"</div>

                            {expanded === idx && (
                                <div className="crucible-details">
                                    <div className="crucible-reason">
                                        <strong>Reason:</strong> {entry.analysis.reason}
                                    </div>

                                    {entry.analysis.detectedPatterns?.length > 0 && (
                                        <div className="crucible-patterns">
                                            <strong>Detected Heuristics:</strong>
                                            <ul>
                                                {entry.analysis.detectedPatterns.map((p, i) => (
                                                    <li key={i}><code>{p}</code></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="crucible-exec">
                                        <strong>Sandbox Exit Code:</strong> {entry.execution?.exitCode ?? 'N/A'}
                                        {entry.execution?.timedOut && <span className="timed-out"> (TIMED OUT)</span>}
                                        {entry.execution?.stdout && (
                                            <pre className="exec-output">{entry.execution.stdout.slice(0, 200)}</pre>
                                        )}
                                        {entry.execution?.stderr && (
                                            <pre className="exec-stderr">{entry.execution.stderr.slice(0, 200)}</pre>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
