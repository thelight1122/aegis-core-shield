import React from 'react';

interface NebulaMirrorProps {
    coherence: number;
    fracturedVirtues: string[];
}

export default function NebulaMirror({ coherence, fracturedVirtues }: NebulaMirrorProps) {
    // I-07: Single-hue saturation variant (Blue/Cyan). No red/green/purple valence.
    const baseColor = '#58a6ff';
    const ringColor = baseColor;

    return (
        <>
            <style>{`
                .dynamic-outer-ring {
                    border: 3px solid ${ringColor};
                    opacity: ${0.6 + coherence * 0.4};
                    animation: pulse ${3 - coherence * 2}s infinite ease-in-out;
                }
                .dynamic-middle-ring {
                    border: 2px dashed ${baseColor};
                    opacity: ${0.4 + coherence * 0.4};
                }
                .dynamic-core-glow {
                    background: radial-gradient(circle, ${baseColor}, transparent);
                    opacity: ${0.5 + coherence * 0.5};
                }
                ${fracturedVirtues.map((v, i) => `
                .dynamic-fracture-${i} {
                    top: ${20 + i * 15}%;
                    left: 10%;
                }
                `).join('')}
            `}</style>
            <div className="nebula-wrapper">
                <div className="nebula-container">
                    <div className="nebula-outer-ring dynamic-outer-ring" />
                    <div className="nebula-middle-ring dynamic-middle-ring" />
                    <div className="nebula-core-glow dynamic-core-glow" />
                    {fracturedVirtues.map((v, i) => (
                        <div
                            key={v}
                            className={`fracture-indicator dynamic-fracture-${i}`}
                            title={v}
                        />
                    ))}
                </div>
                <div className="nebula-label">
                    Signal coherence pattern — reflects signal structure, not quality.
                </div>
            </div>
        </>
    );
}
