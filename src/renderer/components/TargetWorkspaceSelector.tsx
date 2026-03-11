import React from 'react';

interface TargetWorkspaceSelectorProps {
    workspacePath: string | null;
    onChangeWorkspace: (path: string | null) => void;
}

export default function TargetWorkspaceSelector({ workspacePath, onChangeWorkspace }: TargetWorkspaceSelectorProps) {

    const handleSelectPath = async () => {
        if (!window.aegisAPI?.selectWorkspace) {
            console.error("AEGIS API missing: IPC hooks for workspace selection unavailable.");
            return;
        }

        const selectedPath = await window.aegisAPI.selectWorkspace();
        if (selectedPath) {
            onChangeWorkspace(selectedPath);
        }
    };

    return (
        <div className="registry-panel workspace-panel">
            <h3>AEGIS Target Operations</h3>
            <p className="text-muted workspace-desc">
                Select a local directory for agents to securely persist DataQuads and enact changes.
            </p>

            <div className="workspace-controls">
                <button onClick={handleSelectPath}>
                    {workspacePath ? "Change Workspace" : "Select Workspace"}
                </button>

                <div className={`workspace-path-display ${workspacePath ? 'has-path' : 'no-path'}`}>
                    {workspacePath || "No workspace selected... Actions will run in-memory."}
                </div>
            </div>
        </div>
    );
}
