import React, { useState, useEffect } from 'react';

interface Signal {
    type: string;
    payload: any;
    source: string;
    swarmId: string;
    timestamp: string;
    integrity?: number;
}

interface ActiveQuarantine {
    prompt: string;
    source: string;
    swarmId: string;
    startTime: string;
}

export default function QuarantineHUD() {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                if (window.aegisAPI?.fetchPrimeSignals) {
                    const data = await window.aegisAPI.fetchPrimeSignals();
                    if (data && !data.error) {
                        setSignals(data);
                        setError(null);
                    } else if (data?.error) {
                        setError(data.error);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 3000); // Poll every 3 seconds for fast UI updates
        return () => clearInterval(interval);
    }, []);

    // Derived state: compute active quarantines
    // A quarantine is active if there is a 'quarantine_start' event without a subsequent 'quarantine_end' for the same prompt/source
    const activeQuarantines: ActiveQuarantine[] = [];

    // Process signals in chronological order to find active ones
    const chronologicalSignals = [...signals].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const signal of chronologicalSignals) {
        if (signal.type === 'quarantine_start') {
            activeQuarantines.push({
                prompt: signal.payload.prompt,
                source: signal.source,
                swarmId: signal.swarmId,
                startTime: signal.timestamp
            });
        } else if (signal.type === 'quarantine_end') {
            const index = activeQuarantines.findIndex(q => q.source === signal.source && q.prompt === signal.payload.prompt);
            if (index !== -1) {
                activeQuarantines.splice(index, 1);
            }
        }
    }

    if (error) {
        return (
            <div className="prime-card card-quarantine">
                <h3>The Quarantine Zone</h3>
                <div className="error-panel">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="prime-card card-quarantine">
            <h3>The Quarantine Zone <span className="live-indicator">• Monitoring</span></h3>

            {activeQuarantines.length === 0 ? (
                <div className="quarantine-empty">
                    <p>No active quarantines.</p>
                </div>
            ) : (
                <div className="quarantine-list">
                    {activeQuarantines.map((q, idx) => {
                        const duration = Math.floor((new Date().getTime() - new Date(q.startTime).getTime()) / 1000);
                        return (
                            <div key={idx} className="quarantine-entry glowing-border warning">
                                <div className="quarantine-header">
                                    <span className="quarantine-agent">{q.source}</span>
                                    <span className="quarantine-timer">{duration}s</span>
                                </div>
                                <div className="quarantine-prompt">
                                    "{q.prompt}"
                                </div>
                                <div className="quarantine-status">
                                    Executing in Sandbox (Crucible Analysis Pending...)
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
