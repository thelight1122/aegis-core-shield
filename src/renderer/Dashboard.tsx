// src/renderer/Dashboard.tsx
// Purpose: Minimal GUI dashboard for AEGIS Core Shield
// Displays gate + IDS flow, coherence nebula, return packets
// v0.1: basic layout + prompt tester

import React, { useState } from 'react';

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    // Placeholder – call processPrompt from main via IPC in full Electron/Tauri
    const mockResult = { admitted: prompt.includes('must') ? false : true };
    setResult(mockResult);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>AEGIS Core Shield</h1>
      <p>Non-force governance layer – seven virtues active</p>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Enter prompt to test..."
        rows={4}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <button onClick={handleSubmit}>Test Gate</button>

      {result && (
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '20px' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}