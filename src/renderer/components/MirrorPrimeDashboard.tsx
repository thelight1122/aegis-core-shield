import React, { useState, useEffect } from 'react';
import QuarantineHUD from './QuarantineHUD';
import VaccineMap from './VaccineMap';
import CrucibleLogs from './CrucibleLogs';
import ConnectionPanel from './ConnectionPanel';
import LiveEventFeed from './LiveEventFeed';

export default function MirrorPrimeDashboard() {
    const [primeStatus, setPrimeStatus] = useState<any>(null);
    const [impactReport, setImpactReport] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (window.aegisAPI?.fetchPrimeStatus) {
                const status = await window.aegisAPI.fetchPrimeStatus();
                setPrimeStatus(status);
            }
            if (window.aegisAPI?.fetchPrimeImpact) {
                const impact = await window.aegisAPI.fetchPrimeImpact();
                setImpactReport(impact);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!primeStatus) {
        return <div className="loading">Initializing Mirror Prime connection...</div>;
    }

    if (primeStatus.error) {
        return <div className="error-panel">{primeStatus.error}</div>;
    }

    return (
        <div className="mode-panel mirror-prime-panel">
            <div className="prime-header">
                <h2>Mirror Prime <span className="live-indicator">• Swarm Consciousness</span></h2>
                <div className="prime-meta">
                    <span>Active Stewards: {primeStatus.stewards?.length || 0}</span>
                    <span>Signals Relayed: {primeStatus.recentSignalsCount || 0}</span>
                    <span>Policy v{primeStatus.policy?.version || 1}</span>
                    <span>Vaccines: {primeStatus.policy?.blacklistedPatterns?.length || 0}</span>
                </div>
            </div>

            <div className="prime-grid">
                {/* 1. Swarm Topology / Steward Registry */}
                <div className="prime-card card-stewards">
                    <h3>Swarm Registry</h3>
                    <div className="registry-list">
                        {primeStatus.stewards?.map((s: any) => (
                            <div key={s.id} className={`steward-entry ${s.status}`}>
                                <div className="steward-info">
                                    <span className="steward-id">{s.id}</span>
                                    <span className="steward-swarm">{s.swarmId || 'Default Swarm'}</span>
                                </div>
                                <div className="steward-metrics">
                                    <span className="metric-badge">M: {s.metrics?.memories || 0}</span>
                                    <span className="metric-badge">A: {s.metrics?.affects || 0}</span>
                                    <span className={`status-dot ${s.status}`}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Impact & Resonance */}
                <div className="prime-card card-impact">
                    <h3>Collective Impact</h3>
                    {impactReport ? (
                        <div className="impact-details">
                            <div className="recommendation-bar">
                                <strong>Assessment:</strong> {impactReport.recommendation}
                            </div>

                            <div className="impact-grid">
                                <div className="impact-virtues">
                                    <h4>Top Virtue Pressures</h4>
                                    <ul>
                                        {impactReport.topVirtueFractures?.map(([v, count]: [string, number]) => (
                                            <li key={v}><strong>{v}</strong>: {count} fractures</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="impact-swarms">
                                    <h4>Swarm Resonance</h4>
                                    {Object.entries(primeStatus.globalResonances || {}).map(([swarm, grf]: [any, any]) => (
                                        <div key={swarm} className="resonance-entry">
                                            <span>{swarm}</span>
                                            <div className="grf-bar-container">
                                                <div
                                                    className="grf-bar"
                                                    style={{ width: `${grf * 100}%`, backgroundColor: grf < 0.7 ? '#ff4d4d' : '#00e676' }}
                                                />
                                            </div>
                                            <span>{(grf * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>Awaiting impact synthesis...</p>
                    )}
                </div>
            </div>

            {/* 3. Live Event Feed (SSE - real time push) */}
            <div className="prime-grid">
                <LiveEventFeed />
            </div>

            {/* 4. Immune System Panels */}
            <div className="prime-grid prime-grid-immune">
                <QuarantineHUD />
                <VaccineMap policy={primeStatus.policy || null} />
            </div>

            {/* 4. Crucible Intelligence Logs */}
            <div className="prime-grid">
                <CrucibleLogs />
            </div>

            {/* 5. Connectivity Panel */}
            <div className="prime-grid">
                <ConnectionPanel />
            </div>

            {/* 6. Action HUD */}
            <div className="prime-actions">
                <button onClick={async () => {
                    const res = await fetch(`${process.env.AEGIS_PRIME_URL || 'http://localhost:8888'}/reflect`, { method: 'POST' });
                    const data = await res.json();
                    alert(`Swarm reflection triggered. Results: ${JSON.stringify(data.results)}`);
                }}>
                    Trigger Swarm-Wide Reflection
                </button>
            </div>
        </div>
    );
}
