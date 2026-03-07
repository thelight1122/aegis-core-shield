import React from 'react';

interface Policy {
    version: number;
    globalThresholdMultiplier: number;
    blacklistedPatterns: string[];
}

interface VaccineMapProps {
    policy: Policy | null;
}

export default function VaccineMap({ policy }: VaccineMapProps) {
    if (!policy) {
        return (
            <div className="prime-card card-vaccines">
                <h3>Vaccine Propagation Network</h3>
                <div className="loading">Awaiting Swarm Policy Data...</div>
            </div>
        );
    }

    const { blacklistedPatterns, version } = policy;
    const activeVaccines = blacklistedPatterns.length;

    return (
        <div className="prime-card card-vaccines">
            <div className="vaccine-header">
                <h3>Vaccine Propagation Network</h3>
                <span className="vaccine-badge">Policy Version: {version}</span>
            </div>

            <div className="vaccine-stats">
                <div className="stat-box">
                    <span className="stat-value">{activeVaccines}</span>
                    <span className="stat-label">Synthesized Vaccines</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value status-good">Active</span>
                    <span className="stat-label">Swarm Inoculation Status</span>
                </div>
            </div>

            <div className="vaccine-list">
                <h4>Active Threat Signatures (Blacklisted Patterns)</h4>
                {activeVaccines === 0 ? (
                    <p className="no-vaccines">Swarm immune system is clean. No active vaccines.</p>
                ) : (
                    <ul>
                        {blacklistedPatterns.map((pattern, idx) => (
                            <li key={idx} className="vaccine-item">
                                <span className="vaccine-icon">🛡️</span>
                                <code className="vaccine-pattern">{pattern}</code>
                                <span className="vaccine-status">Propagated</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
