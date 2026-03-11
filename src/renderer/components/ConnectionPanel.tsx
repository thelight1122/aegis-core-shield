import React, { useState, useEffect } from 'react';

interface StewardConnection {
    id: string;
    address: string;
    swarmId?: string;
    status: 'online' | 'offline' | 'degraded' | 'checking';
    latencyMs: number | null;
    lastSeen: string;
}

// Ping a steward's /health endpoint and measure round-trip time
async function pingSteward(address: string): Promise<{ ok: boolean; latencyMs: number }> {
    const start = performance.now();
    try {
        const res = await fetch(`${address}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(4000) // 4s timeout
        });
        const elapsed = Math.round(performance.now() - start);
        return { ok: res.ok, latencyMs: elapsed };
    } catch {
        return { ok: false, latencyMs: -1 };
    }
}

function latencyColor(ms: number | null): string {
    if (ms === null || ms < 0) return '#f85149'; // red — offline
    if (ms < 100) return '#3fb950';              // green — excellent
    if (ms < 300) return '#d29922';              // amber — ok
    return '#f0883e';                             // orange — degraded
}

function statusLabel(s: StewardConnection): { text: string; cls: string } {
    switch (s.status) {
        case 'online': return { text: '● Online', cls: 'conn-online' };
        case 'offline': return { text: '○ Offline', cls: 'conn-offline' };
        case 'degraded': return { text: '◐ Degraded', cls: 'conn-degraded' };
        case 'checking': return { text: '◌ Checking', cls: 'conn-checking' };
    }
}

export default function ConnectionPanel() {
    const [connections, setConnections] = useState<StewardConnection[]>([]);
    const [primeStatus, setPrimeStatus] = useState<'online' | 'offline'>('offline');
    const [lastRefresh, setLastRefresh] = useState<string>('');

    const refresh = async () => {
        setLastRefresh(new Date().toLocaleTimeString());

        // Fetch steward list from Prime
        if (!window.aegisAPI?.fetchPrimeStatus) return;
        const status = await window.aegisAPI.fetchPrimeStatus();
        if (!status || status.error) {
            setPrimeStatus('offline');
            return;
        }

        setPrimeStatus('online');
        const stewards: any[] = status.stewards || [];

        // Mark all as checking while pinging
        const checking: StewardConnection[] = stewards.map(s => ({
            id: s.id,
            address: s.address || 'http://localhost:8787',
            swarmId: s.swarmId,
            status: 'checking',
            latencyMs: null,
            lastSeen: s.lastSeen || ''
        }));
        setConnections(checking);

        // Probe each steward in parallel
        const probed = await Promise.all(
            checking.map(async (c) => {
                const { ok, latencyMs } = await pingSteward(c.address);
                return {
                    ...c,
                    latencyMs: ok ? latencyMs : null,
                    status: ok
                        ? (latencyMs > 300 ? 'degraded' : 'online')
                        : 'offline'
                } as StewardConnection;
            })
        );

        setConnections(probed);
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 8000); // Probe every 8 seconds
        return () => clearInterval(interval);
    }, []);

    const onlineCount = connections.filter(c => c.status === 'online' || c.status === 'degraded').length;

    return (
        <div className="prime-card card-connections">
            <div className="conn-header">
                <h3>Steward Connectivity</h3>
                <div className="conn-badges">
                    <span className={`prime-status-badge ${primeStatus}`}>
                        Prime {primeStatus === 'online' ? '● Online' : '○ Offline'}
                    </span>
                    <span className="conn-count">{onlineCount}/{connections.length} reachable</span>
                </div>
            </div>

            {connections.length === 0 ? (
                <div className="conn-empty">
                    {primeStatus === 'offline'
                        ? 'Mirror Prime is unreachable. Is it running?'
                        : 'No Stewards registered with Prime yet.'}
                </div>
            ) : (
                <div className="conn-list">
                    {connections.map(c => {
                        const label = statusLabel(c);
                        return (
                            <div key={c.id} className={`conn-entry ${c.status}`}>
                                <div className="conn-identity">
                                    <span className="conn-id">{c.id}</span>
                                    <span className="conn-swarm">{c.swarmId || 'Default Swarm'}</span>
                                </div>

                                <div className="conn-address">{c.address}</div>

                                <div className="conn-metrics">
                                    <span className={`conn-status-badge ${label.cls}`}>{label.text}</span>
                                    {c.latencyMs !== null && c.latencyMs >= 0 ? (
                                        <span className="conn-latency" style={{ color: latencyColor(c.latencyMs) }}>
                                            {c.latencyMs}ms
                                        </span>
                                    ) : (
                                        <span className="conn-latency" style={{ color: '#f85149' }}>
                                            timeout
                                        </span>
                                    )}
                                </div>

                                {c.lastSeen && (
                                    <div className="conn-lastseen">
                                        Last seen: {new Date(c.lastSeen).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="conn-footer">
                <span className="conn-refresh">Updated: {lastRefresh}</span>
                <button className="btn-probe" onClick={refresh}>↻ Probe Now</button>
            </div>
        </div>
    );
}
