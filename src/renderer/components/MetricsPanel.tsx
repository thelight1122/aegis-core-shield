import React from 'react';

interface Metrics {
    totalAgents: number;
    totalEntries: number;
    backupCount: number;
    avgCoherence: number;
}

export default function MetricsPanel() {
    const [metrics, setMetrics] = React.useState<Metrics | null>(null);

    const refreshMetrics = async () => {
        if (window.aegisAPI?.getMetrics) {
            const m = await window.aegisAPI.getMetrics();
            setMetrics(m);
        }
    };

    React.useEffect(() => {
        refreshMetrics();
        const interval = setInterval(refreshMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!metrics) return <div className="metrics-panel-loading">Loading Telemetry...</div>;

    return (
        <div className="metrics-panel registry-panel mb-4">
            <h3 className="metrics-title">System Telemetry</h3>
            <div className="metrics-grid">
                <div className="metric-item">
                    <span className="metric-label">Managed Agents</span>
                    <span className="metric-value">{metrics.totalAgents}</span>
                </div>
                <div className="metric-item">
                    <span className="metric-label">DataQuad Points</span>
                    <span className="metric-value">{metrics.totalEntries}</span>
                </div>
                <div className="metric-item">
                    <span className="metric-label">Active Backups</span>
                    <span className="metric-value">{metrics.backupCount}</span>
                </div>
                <div className="metric-item">
                    <span className="metric-label">Avg Coherence</span>
                    <span className="metric-value">{(metrics.avgCoherence * 100).toFixed(1)}%</span>
                </div>
            </div>
            <div className="metrics-footer mt-2 flex justify-between items-center">
                <small>Auto-refreshing via AEGIS-Observability layer</small>
                <button
                    className="p-1 px-2 bg-red-900 bg-opacity-30 border border-red-500 rounded text-[10px] hover:bg-opacity-50 transition-all"
                    onClick={() => window.aegisAPI.triggerAlert('Manual Health Check Triggered', 'info')}
                >
                    Trigger Health Alert
                </button>
            </div>
        </div>
    );
}
