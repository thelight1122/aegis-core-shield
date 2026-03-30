import React, { useEffect, useMemo, useState } from 'react';

type SessionSummary = {
    sessionId: string;
    lineageDepth?: number;
    latestRecord?: {
        tensor?: string;
        timestamp?: string;
        id?: string;
    };
    recordCounts?: Record<string, number>;
};

const SCAN_SIGNAL = 'Assess current session state for continuity and drift.';
const DEFAULT_PEER_JSON = `{
  "status": "bootstrapped",
  "source": "aegis-core-shield"
}`;
const DEFAULT_PCT_JSON = `{
  "goal": "continue stewardship",
  "status": "active"
}`;
const DEFAULT_SPINE_PATTERN = 'The session is actively stewarded through the Shield companion app.';

function formatTimestamp(timestamp?: string) {
    if (!timestamp) return 'No recent activity';
    return new Date(timestamp).toLocaleString([], {
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function metricCount(summary: SessionSummary | null, tensor: string) {
    return summary?.recordCounts?.[tensor] ?? 0;
}

export default function OpenClawSidecar() {
    const [health, setHealth] = useState<any>(null);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [busyAction, setBusyAction] = useState<'refresh' | 'seed' | 'scan' | 'peer' | 'pct' | 'spine' | null>(null);
    const [latestResult, setLatestResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [peerStateInput, setPeerStateInput] = useState(DEFAULT_PEER_JSON);
    const [pctContextInput, setPctContextInput] = useState(DEFAULT_PCT_JSON);
    const [spinePattern, setSpinePattern] = useState(DEFAULT_SPINE_PATTERN);

    const selectedSession = useMemo(
        () => sessions.find((session) => session.sessionId === selectedSessionId) || null,
        [sessions, selectedSessionId]
    );

    const loadSummary = async (sessionId: string) => {
        const response = await window.aegisAPI.fetchCoreSessionSummary(sessionId);
        if (!response?.ok) {
            throw new Error(response?.error || `Failed to load session summary for ${sessionId}.`);
        }
        setSummary(response.summary ?? response);
        return response;
    };

    const loadSessions = async (preserveSelection = true) => {
        const healthResponse = await window.aegisAPI.fetchCoreHealth();
        setHealth(healthResponse);

        const response = await window.aegisAPI.fetchCoreSessions();
        if (!response?.ok) {
            throw new Error(response?.error || 'Failed to load Core sessions.');
        }

        const nextSessions = response.sessions ?? [];
        setSessions(nextSessions);

        const nextSelectedId = preserveSelection
            ? selectedSessionId && nextSessions.some((session: SessionSummary) => session.sessionId === selectedSessionId)
                ? selectedSessionId
                : nextSessions[0]?.sessionId ?? null
            : nextSessions[0]?.sessionId ?? null;

        setSelectedSessionId(nextSelectedId);
        if (nextSelectedId) {
            await loadSummary(nextSelectedId);
        } else {
            setSummary(null);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            try {
                setError(null);
                setBusyAction('refresh');
                await loadSessions(false);
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setBusyAction(null);
                }
            }
        };

        initialize();

        const interval = setInterval(async () => {
            try {
                await loadSessions(true);
            } catch {
                // Keep the current view stable if polling fails.
            }
        }, 15000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!selectedSessionId) return;

        let cancelled = false;
        loadSummary(selectedSessionId).catch((err: any) => {
            if (!cancelled) {
                setError(err.message);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [selectedSessionId]);

    const handleRefresh = async () => {
        try {
            setError(null);
            setBusyAction('refresh');
            await loadSessions(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyAction(null);
        }
    };

    const handleSeed = async () => {
        const suggestedId = `shield-session-${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}`;
        const sessionId = window.prompt('Enter a session ID for the new Core session.', suggestedId);
        if (!sessionId) return;

        try {
            setError(null);
            setBusyAction('seed');
            const response = await window.aegisAPI.seedCoreSession(sessionId.trim());
            if (!response?.ok) {
                throw new Error(response?.error || 'Failed to seed Core session.');
            }
            setLatestResult(response);
            await loadSessions(false);
            setSelectedSessionId(response.state?.sessionId || sessionId.trim());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyAction(null);
        }
    };

    const handleScan = async () => {
        if (!selectedSessionId) return;

        try {
            setError(null);
            setBusyAction('scan');
            const response = await window.aegisAPI.runCoreScan(selectedSessionId, SCAN_SIGNAL);
            if (!response?.ok) {
                throw new Error(response?.error || 'Core scan failed.');
            }
            setLatestResult(response);
            await loadSummary(selectedSessionId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyAction(null);
        }
    };

    const parseJsonInput = (value: string, label: string) => {
        try {
            return JSON.parse(value);
        } catch {
            throw new Error(`${label} must be valid JSON.`);
        }
    };

    const handleAppendPeer = async () => {
        if (!selectedSessionId) return;

        try {
            setError(null);
            setBusyAction('peer');
            const presentState = parseJsonInput(peerStateInput, 'PEER state');
            const response = await window.aegisAPI.appendCorePeer(selectedSessionId, presentState);
            if (!response?.ok) {
                throw new Error(response?.error || 'Appending PEER failed.');
            }
            setLatestResult(response);
            await loadSessions(true);
            await loadSummary(selectedSessionId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyAction(null);
        }
    };

    const handleAppendPCT = async () => {
        if (!selectedSessionId) return;

        try {
            setError(null);
            setBusyAction('pct');
            const workingContext = parseJsonInput(pctContextInput, 'PCT working context');
            const response = await window.aegisAPI.appendCorePCT(selectedSessionId, workingContext);
            if (!response?.ok) {
                throw new Error(response?.error || 'Appending PCT failed.');
            }
            setLatestResult(response);
            await loadSessions(true);
            await loadSummary(selectedSessionId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyAction(null);
        }
    };

    const handleWriteSpine = async () => {
        if (!selectedSessionId) return;

        try {
            setError(null);
            setBusyAction('spine');
            const response = await window.aegisAPI.writeCoreSpine(selectedSessionId, spinePattern.trim() || DEFAULT_SPINE_PATTERN, true);
            if (!response?.ok) {
                throw new Error(response?.error || 'Writing SPINE failed.');
            }
            setLatestResult(response);
            await loadSessions(true);
            await loadSummary(selectedSessionId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyAction(null);
        }
    };

    return (
        <div className="mode-panel sidecar-panel core-sidecar-panel">
            <div className="sidecar-header">
                <div>
                    <h2>Core Shield Companion <span className="live-indicator">• Live Core</span></h2>
                    <span className="sidecar-endpoints">GET /sessions • GET /session-summary/:sessionId • POST /seed • POST /scan</span>
                </div>
                <div className="core-health-pill">
                    {health?.ok ? 'Core Connected' : 'Core Unreachable'}
                </div>
            </div>

            {error && (
                <div className="core-error-banner">
                    {error}
                </div>
            )}

            <div className="core-sidecar-layout">
                <aside className="core-session-list">
                    <div className="core-panel-header">
                        <h3>Active Sessions</h3>
                        <div className="core-panel-actions">
                            <button className="mode-button" onClick={handleRefresh} disabled={busyAction !== null}>
                                {busyAction === 'refresh' ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button className="mode-button active" onClick={handleSeed} disabled={busyAction !== null}>
                                {busyAction === 'seed' ? 'Seeding...' : 'Seed Session'}
                            </button>
                        </div>
                    </div>

                    <div className="core-session-list-body">
                        {sessions.length > 0 ? sessions.map((session) => (
                            <button
                                key={session.sessionId}
                                className={`core-session-item ${selectedSessionId === session.sessionId ? 'selected' : ''}`}
                                onClick={() => setSelectedSessionId(session.sessionId)}
                            >
                                <span className="core-session-name">{session.sessionId}</span>
                                <span className="core-session-meta">
                                    Depth {session.lineageDepth ?? 0} • {session.latestRecord?.tensor ?? 'No records'}
                                </span>
                            </button>
                        )) : (
                            <div className="empty-logs">
                                <p>No Core sessions discovered yet.</p>
                                <code>Use "Seed Session" to create the first app-linked session.</code>
                            </div>
                        )}
                    </div>
                </aside>

                <section className="core-session-detail">
                    <div className="core-panel-header">
                        <div>
                            <h3>{selectedSessionId || 'No session selected'}</h3>
                            <div className="text-muted">
                                Latest record: {selectedSession?.latestRecord?.tensor || 'None'} @ {formatTimestamp(selectedSession?.latestRecord?.timestamp)}
                            </div>
                        </div>
                        <div className="core-panel-actions">
                            <button className="mode-button" onClick={handleRefresh} disabled={busyAction !== null || !selectedSessionId}>
                                Refresh Summary
                            </button>
                            <button className="mode-button active" onClick={handleScan} disabled={busyAction !== null || !selectedSessionId}>
                                {busyAction === 'scan' ? 'Running Scan...' : 'Run Core Scan'}
                            </button>
                        </div>
                    </div>

                    <div className="core-metrics-grid">
                        {['PEER', 'PCT', 'NCT', 'SPINE'].map((tensor) => (
                            <div key={tensor} className="core-metric-card">
                                <div className="core-metric-label">{tensor}</div>
                                <div className="core-metric-value">{metricCount(summary, tensor)}</div>
                            </div>
                        ))}
                        <div className="core-metric-card">
                            <div className="core-metric-label">Lineage Depth</div>
                            <div className="core-metric-value">{summary?.lineageDepth ?? selectedSession?.lineageDepth ?? 0}</div>
                        </div>
                    </div>

                    <div className="core-action-grid">
                        <div className="core-action-card">
                            <div className="core-result-header">Append PEER</div>
                            <div className="text-muted">Capture present-state facts for the selected session.</div>
                            <textarea
                                className="core-action-input"
                                value={peerStateInput}
                                onChange={(event) => setPeerStateInput(event.target.value)}
                                disabled={busyAction !== null || !selectedSessionId}
                            />
                            <button className="mode-button active core-action-button" onClick={handleAppendPeer} disabled={busyAction !== null || !selectedSessionId}>
                                {busyAction === 'peer' ? 'Appending PEER...' : 'Append PEER'}
                            </button>
                        </div>

                        <div className="core-action-card">
                            <div className="core-result-header">Append PCT</div>
                            <div className="text-muted">Track the active working context this session is carrying.</div>
                            <textarea
                                className="core-action-input"
                                value={pctContextInput}
                                onChange={(event) => setPctContextInput(event.target.value)}
                                disabled={busyAction !== null || !selectedSessionId}
                            />
                            <button className="mode-button active core-action-button" onClick={handleAppendPCT} disabled={busyAction !== null || !selectedSessionId}>
                                {busyAction === 'pct' ? 'Appending PCT...' : 'Append PCT'}
                            </button>
                        </div>

                        <div className="core-action-card">
                            <div className="core-result-header">Write SPINE</div>
                            <div className="text-muted">Preserve the continuity pattern you want anchored in the lineage.</div>
                            <textarea
                                className="core-action-input core-action-input-short"
                                value={spinePattern}
                                onChange={(event) => setSpinePattern(event.target.value)}
                                disabled={busyAction !== null || !selectedSessionId}
                            />
                            <button className="mode-button active core-action-button" onClick={handleWriteSpine} disabled={busyAction !== null || !selectedSessionId}>
                                {busyAction === 'spine' ? 'Writing SPINE...' : 'Write SPINE'}
                            </button>
                        </div>
                    </div>

                    <div className="core-result-panel">
                        <div className="core-result-header">Latest Core Result</div>
                        {latestResult ? (
                            <pre className="core-result-json">{JSON.stringify(latestResult, null, 2)}</pre>
                        ) : (
                            <div className="empty-logs">
                                <p>No Core action executed from the app yet.</p>
                                <code>Run a scan or seed a session to confirm the live integration path.</code>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
