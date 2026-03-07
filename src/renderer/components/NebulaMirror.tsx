import React from 'react';

interface NebulaMirrorProps {
    coherence: number;
    fracturedVirtues: string[];
}

export default function NebulaMirror({ coherence, fracturedVirtues }: NebulaMirrorProps) {
    const isHighCoherence = coherence > 0.8;
    const ringColor = isHighCoherence ? '#58a6ff' : '#d2a8ff'; // Purple indicates structural realignment, not "bad"

    return (
        <>
            <style>{`
                .dynamic-outer-ring {
                    border: 3px solid ${ringColor};
                    opacity: ${0.6 + coherence * 0.4};
                    animation: pulse ${3 - coherence * 2}s infinite ease-in-out;
                }
                .dynamic-middle-ring {
                    border: 2px dashed ${fracturedVirtues.length === 0 ? '#58a6ff' : '#d2a8ff'};
                }
                .dynamic-core-glow {
                    background: radial-gradient(circle, ${ringColor}, transparent);
                    opacity: ${0.5 + coherence * 0.5};
                }
                ${fracturedVirtues.map((v, i) => `
                .dynamic-fracture-${i} {
                    top: ${20 + i * 15}%;
                    left: 10%;
                }
                `).join('')}
            `}</style>
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
        </>
    );
}
