import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    value: string;
    language?: string;
    onChange?: (value: string | undefined) => void;
    height?: string;
    readOnly?: boolean;
}

export default function CodeEditor({ value, language = 'javascript', onChange, height = '400px', readOnly = false }: CodeEditorProps) {
    return (
        <div className="monaco-editor-container" style={{ border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
            <Editor
                height={height}
                language={language}
                theme="vs-dark"
                value={value}
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    fontFamily: "'Inter', 'Consolas', 'Courier New', monospace",
                    readOnly,
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 },
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: 'on'
                }}
            />
        </div>
    );
}
