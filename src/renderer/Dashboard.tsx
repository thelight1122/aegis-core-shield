// src/renderer/Dashboard.tsx
// Purpose: Main GUI dashboard for AEGIS Core Shield
// Displays prompt input, gate/IDS flow result, and nebula visualization
// Nebula: visual coherence mirror (rings + color shift) – observation only

import React, { useState, ChangeEvent } from 'react';
import { processPrompt } from '../shared/main/ids-processor';
import { ReturnPacket } from '../shared/main/discernment-gate';
import './Dashboard.css';

export default function Dashboard() {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<any>(null);
    const [coherence, setCoherence] = useState(0); // 0–1 (Integrity proxy)
    const [fracturedVirtues, setFracturedVirtues] = useState<string[]>([]);

    const handleSubmit = async () => {
        let res: any;
        if (window.aegisAPI) {
            res = await window.aegisAPI.processPrompt(prompt);
        } else {
            // Fallback for dev/non-Electron
            res = processPrompt(prompt);
        }

        setResult(res);

        // Update coherence score & fractures from result
        if (res && 'admitted' in res && res.admitted) {
            setCoherence(1.0);
            setFracturedVirtues([]);
        } else if (res && 'status' in res && res.status === 'discernment_gate_return') {
            const packet = res as ReturnPacket;
            const scores = Object.values(packet.observed_alignment).map(v => v.score);
            const minScore = scores.length > 0 ? Math.min(...scores) : 0;
            setCoherence(minScore);

            const fractured = Object.entries(packet.observed_alignment)
                .filter(([_, v]) => v.score < 1)
                .map(([virtue]) => virtue);
            setFracturedVirtues(fractured);
        } else {
            setCoherence(0);
            setFracturedVirtues([]);
        }
    };

    const isHighCoherence = coherence > 0.8;
    const ringColor = isHighCoherence ? '#58a6ff' : '#f78166';

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">AEGIS Core Shield</h1>
            <p>Non-force governance layer – seven virtues active</p>

            {/* Nebula Visualization – coherence mirror */}
            <div className="nebula-container">
                {/* Outer ring – overall coherence */}
                <div
                    className="nebula-outer-ring"
                    style={{
                        border: `3px solid ${ringColor}`,
                        opacity: 0.6 + coherence * 0.4,
                        animation: `pulse ${3 - coherence * 2}s infinite ease-in-out`
                    }}
                />

                {/* Middle ring – virtue balance */}
                <div
                    className="nebula-middle-ring"
                    style={{
                        border: `2px dashed ${fracturedVirtues.length === 0 ? '#2ea043' : '#f78166'}`,
                    }}
                />

                {/* Core glow – resonance center */}
                <div
                    className="nebula-core-glow"
                    style={{
                        background: `radial-gradient(circle, ${ringColor}, transparent)`,
                        opacity: 0.5 + coherence * 0.5
                    }}
                />

                {/* Fracture indicators */}
                {fracturedVirtues.map((v, i) => (
                    <div
                        key={v}
                        className="fracture-indicator"
                        style={{
                            top: `${20 + i * 15}%`,
                            left: '10%',
                        }}
                        title={v}
                    />
                ))}
            </div>

            <textarea
                className="prompt-textarea"
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                placeholder="Enter prompt to test gate..."
                rows={4}
            />

            <button className="test-button" onClick={handleSubmit}>
                Test Gate & Flow
            </button>

            {result && (
                <pre className="result-output">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}