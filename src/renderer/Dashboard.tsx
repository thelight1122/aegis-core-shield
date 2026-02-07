import React, { useState, ChangeEvent } from 'react';
import { processPrompt } from '../shared/main/ids-processor';
import './Dashboard.css';

export default function Dashboard() {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async () => {
        if (window.aegisAPI) {
            const result = await window.aegisAPI.processPrompt(prompt);
            setResult(result);
        } else {
            // Fallback for dev/non-Electron
            const result = processPrompt(prompt);
            setResult(result);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>AEGIS Core Shield</h1>
            <p>Non-force governance layer – seven virtues active</p>

            <textarea
                className="prompt-textarea"
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                placeholder="Enter prompt to test..."
                rows={4}
            />

            <button className="test-button" onClick={handleSubmit}>Test Gate</button>

            {result && (
                <pre className="result-output">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}