// src/index.ts
// Purpose: Public API export point for aegis-core-shield package
// Exposes core discernment gate functionality for programmatic use
// Usage: import { discernmentGate, runIDS } from 'aegis-core-shield'

// Core gate functionality
export { discernmentGate, GateResult, ReturnPacket, VirtueScores } from './shared/main/discernment-gate';

// IDS processing pipeline
export { runIDS, identify, define, suggest, IDSResult } from './shared/main/ids-processor';

// Logging infrastructure
export { initGateLogger, logGateDecision, readRecentLogs, getLogEntryCount, GateLogEntry } from './shared/main/gate-logger';

// Tokenization utilities
export { tokenizeAndChunk, Unit } from './shared/main/tokenization';

// Individual virtue scorers (for custom implementations)
export { scoreHonesty } from './shared/main/virtue-scoring-honesty';
export { scoreRespect } from './shared/main/virtue-scoring-respect';
export { scoreAttention } from './shared/main/virtue-scoring-attention';
export { scoreAffection } from './shared/main/virtue-scoring-affection';
export { scoreLoyalty } from './shared/main/virtue-scoring-loyalty';
export { scoreTrust } from './shared/main/virtue-scoring-trust';
export { scoreCommunication } from './shared/main/virtue-scoring-communication';
