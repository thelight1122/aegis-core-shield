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

type ActivityEntry = {
    id: string;
    action: string;
    status: 'running' | 'success' | 'error';
    detail: string;
    timestamp: string;
};

type BusyAction = 'refresh' | 'seed' | 'scan' | 'peer' | 'pct' | 'spine' | 'nct' | 'sssp' | null;

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
const DEFAULT_NCT_SUMMARY = 'Shield companion confirmed the session remains active, connected, and under live stewardship.';
const DEFAULT_SSSP_TRIGGER = 'shield-sidecar-stewardship';

function formatTimestamp(timestamp?: string) {
    if (!timestamp) return 'No recent activity';
    return new Date(timestamp).toLocaleString([], {
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function metricCount(summary: SessionSummary | null, tensor: string) {
    return summary?.recordCounts?.[tensor] ?? 0;
}

function createActivity(action: string, status: ActivityEntry['status'], detail: string): ActivityEntry {
    return {
        id: `${action}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        action,
        status,
        detail,
        timestamp: new Date().toISOString()
    };
}

export default function OpenClawSidecar() {
    const [health, setHealth] = useState<any>(null);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [busyAction, setBusyAction] = useState<BusyAction>(null);
    const [latestResult, setLatestResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('Ready to connect the Shield sidecar to a live Core session.');
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [peerStateInput, setPeerStateInput] = useState(DEFAULT_PEER_JSON);
    const [pctContextInput, setPctContextInput] = useState(DEFAULT_PCT_JSON);
    const [spinePattern, setSpinePattern] = useState(DEFAULT_SPINE_PATTERN);
    const [nctSummary, setNctSummary] = useState(DEFAULT_NCT_SUMMARY);
    const [ssspTrigger, setSsspTrigger] = useState(DEFAULT_SSSP_TRIGGER);

    const selectedSession = useMemo(
        () => sessions.find((session) => session.sessionId === selectedSessionId) || null,
        [sessions, selectedSessionId]
    );

    const pushActivity = (entry: ActivityEntry) => {
        setActivity((current) => [entry, ...current].slice(0, 10));
    };

    const setActionState = (message: string, entry?: ActivityEntry) => {
        setStatusMessage(message);
        if (entry) {
            pushActivity(entry);
        }
    };

    const completeAction = (action: string, detail: string, response: any) => {
        setLatestResult(response);
        setError(null);
        setActionState(detail, createActivity(action, 'success', detail));
    };

    const failAction = (action: string, err: any) => {
        const message = err.message || `${action} failed.`;
        setError(message);
        setActionState(message, createActivity(action, 'error', message));
    };

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

    const refreshSessionData = async (preserveSelection = true) => {
        await loadSessions(preserveSelection);
        if (selectedSessionId) {
            await loadSummary(selectedSessionId);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            try {
                setBusyAction('refresh');
                setActionState('Connecting to the live Core service...', createActivity('Refresh', 'running', 'Connecting to the live Core service...'));
                await loadSessions(false);
                if (!cancelled) {
                    setActionState('Connected to the live Core service.', createActivity('Refresh', 'success', 'Connected to the live Core service.'));
                }
            } catch (err: any) {
                if (!cancelled) {
                    failAction('Refresh', err);
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
                // Keep current state stable during background polling failures.
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
                failAction('Load Summary', err);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [selectedSessionId]);

    const parseJsonInput = (value: string, label: string) => {
        try {
            return JSON.parse(value);
        } catch {
            throw new Error(`${label} must be valid JSON.`);
        }
    };

    const runAction = async (busy: Exclude<BusyAction, null>, label: string, work: () => Promise<any>, successMessage: string) => {
        try {
            setBusyAction(busy);
            setError(null);
            setActionState(successMessage.replace('completed', 'running'), createActivity(label, 'running', `${label} is running...`));
            const response = await work();
            if (!response?.ok) {
                throw new Error(response?.error || `${label} failed.`);
            }
            completeAction(label, successMessage, response);
            await refreshSessionData(true);
        } catch (err: any) {
            failAction(label, err);
        } finally {
            setBusyAction(null);
        }
    };

    const handleRefresh = async () => {
        await runAction('refresh', 'Refresh', async () => {
            await loadSessions(true);
            return { ok: true };
        }, 'Refresh completed successfully.');
    };

    const handleSeed = async () => {
        const suggestedId = `shield-session-${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}`;
        const sessionId = window.prompt('Enter a session ID for the new Core session.', suggestedId);
        if (!sessionId) return;

        await runAction('seed', 'Seed Session', async () => {
            const response = await window.aegisAPI.seedCoreSession(sessionId.trim());
            if (response?.ok) {
                setSelectedSessionId(response.state?.sessionId || sessionId.trim());
            }
            return response;
        }, `Seed session completed for ${sessionId.trim()}.`);
    };

    const handleScan = async () => {
        if (!selectedSessionId) return;
        await runAction('scan', 'Run Scan', () => window.aegisAPI.runCoreScan(selectedSessionId, SCAN_SIGNAL), `Scan completed for ${selectedSessionId}.`);
    };

    const handleAppendPeer = async () => {
        if (!selectedSessionId) return;
        await runAction('peer', 'Append PEER', () => {
            const presentState = parseJsonInput(peerStateInput, 'PEER state');
            return window.aegisAPI.appendCorePeer(selectedSessionId, presentState);
        }, `PEER appended for ${selectedSessionId}.`);
    };

    const handleAppendPCT = async () => {
        if (!selectedSessionId) return;
        await runAction('pct', 'Append PCT', () => {
            const workingContext = parseJsonInput(pctContextInput, 'PCT working context');
            return window.aegisAPI.appendCorePCT(selectedSessionId, workingContext);
        }, `PCT appended for ${selectedSessionId}.`);
    };

    const handleWriteSpine = async () => {
        if (!selectedSessionId) return;
        await runAction('spine', 'Write SPINE', () => window.aegisAPI.writeCoreSpine(selectedSessionId, spinePattern.trim() || DEFAULT_SPINE_PATTERN, true), `SPINE written for ${selectedSessionId}.`);
    };

    const handleCompressNCT = async () => {
        if (!selectedSessionId) return;
        await runAction('nct', 'Compress NCT', () => window.aegisAPI.compressCoreNCT(selectedSessionId, nctSummary.trim() || DEFAULT_NCT_SUMMARY), `NCT compression completed for ${selectedSessionId}.`);
    };

    const handleRequestSSSP = async () => {
        if (!selectedSessionId) return;
        await runAction('sssp', 'Request SSSP', () => window.aegisAPI.requestCoreSSSP(selectedSessionId, ssspTrigger.trim() || DEFAULT_SSSP_TRIGGER), `SSSP requested for ${selectedSessionId}.`);
    };

    return (
        <div className="mode-panel sidecar-panel core-sidecar-panel">
            <div className="sidecar-header">
                <div>
                    <h2>Core Shield Companion <span className="live-indicator">• Live Core</span></h2>
                    <span className="sidecar-endpoints">Live stewardship for seed, scan, PEER, PCT, NCT, SPINE, and SSSP</span>
                </div>
                <div className="core-health-pill">
                    {health?.ok ? 'Core Connected' : 'Core Unreachable'}
                </div>
            </div>

            <div className={`core-monitor-panel ${error ? 'is-error' : 'is-healthy'}`}>
                <div className="core-monitor-label">Live Monitor</div>
                <div className="core-monitor-message">{statusMessage}</div>
                {selectedSessionId && (
                    <div className="core-monitor-meta">
                        Selected session: <span className="mono-text">{selectedSessionId}</span>
                    </div>
                )}
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

                    <div className="core-activity-panel">
                        <div className="core-result-header">Recent Activity</div>
                        {activity.length > 0 ? (
                            <div className="core-activity-list">
                                {activity.map((entry) => (
                                    <div key={entry.id} className={`core-activity-item status-${entry.status}`}>
                                        <div className="core-activity-title-row">
                                            <span className="core-activity-title">{entry.action}</span>
                                            <span className="core-activity-time">{formatTimestamp(entry.timestamp)}</span>
                                        </div>
                                        <div className="core-activity-detail">{entry.detail}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted">No actions recorded yet.</div>
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

                        <div className="core-action-card">
                            <div className="core-result-header">Compress NCT</div>
                            <div className="text-muted">Distill the current continuity picture into a compact narrative memory.</div>
                            <textarea
                                className="core-action-input core-action-input-short"
                                value={nctSummary}
                                onChange={(event) => setNctSummary(event.target.value)}
                                disabled={busyAction !== null || !selectedSessionId}
                            />
                            <button className="mode-button active core-action-button" onClick={handleCompressNCT} disabled={busyAction !== null || !selectedSessionId}>
                                {busyAction === 'nct' ? 'Compressing NCT...' : 'Compress NCT'}
                            </button>
                        </div>

                        <div className="core-action-card">
                            <div className="core-result-header">Request SSSP</div>
                            <div className="text-muted">Capture the current state into a stewarded snapshot request.</div>
                            <textarea
                                className="core-action-input core-action-input-short"
                                value={ssspTrigger}
                                onChange={(event) => setSsspTrigger(event.target.value)}
                                disabled={busyAction !== null || !selectedSessionId}
                            />
                            <button className="mode-button active core-action-button" onClick={handleRequestSSSP} disabled={busyAction !== null || !selectedSessionId}>
                                {busyAction === 'sssp' ? 'Requesting SSSP...' : 'Request SSSP'}
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
                                <code>Run a scan or write a record to confirm the live integration path.</code>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
