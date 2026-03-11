import React, { useState, useEffect } from 'react';

export default function OpenClawSidecar() {
    const [stewardLogs, setStewardLogs] = useState<any[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (window.aegisAPI?.fetchStewardLogs) {
            window.aegisAPI.fetchStewardLogs(50).then(setStewardLogs);
            interval = setInterval(async () => {
                const logs = await window.aegisAPI.fetchStewardLogs(50);
                setStewardLogs(logs);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mode-panel sidecar-panel">
            <div className="sidecar-header">
                <h2>Steward Monitor <span className="live-indicator">• Live</span></h2>
                <span className="sidecar-endpoints">POST /openclaw/event • GET /health</span>
            </div>

            <div className="log-table-container">
                {stewardLogs.length > 0 ? (
                    <table className="log-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Agent ID</th>
                                <th>Request ID</th>
                                <th>Gate Result</th>
                                <th>Coherence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stewardLogs.map((log, i) => (
                                <tr key={`${log.request_id}-${i}`}>
                                    <td className="text-muted">
                                        {new Date(log.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td><span className="mono-text">{log.agent_id}</span></td>
                                    <td><span className="mono-text truncate" title={log.request_id}>{log.request_id.split('-')[0] + '...'}</span></td>
                                    <td>
                                        {log.gate.admitted ? (
                                            <span className="badge badge-processed">Processed</span>
                                        ) : (
                                            <span className="badge badge-returned">Returned</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="coherence-bar-container">
                                            <div
                                                className={`coherence-bar ${log.gate.admitted ? 'bg-processed' : 'bg-returned'}`}
                                                // eslint-disable-next-line react/forbid-dom-props
                                                style={{
                                                    width: `${(log.gate.payload?.observed_alignment ?
                                                        (Object.values(log.gate.payload.observed_alignment) as any[]).reduce((min: number, val: any) => Math.min(min, val.score), 1)
                                                        : 1) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-logs">
                        <p>Waiting for OpenClaw events...</p>
                        <code>curl -X POST http://localhost:8787/openclaw/event -d '&#123;...&#125;'</code>
                    </div>
                )}
            </div>
        </div>
    );
}
