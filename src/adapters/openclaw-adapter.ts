import { createHash } from 'crypto';

import { discernmentGate, GateResult } from '../shared/main/discernment-gate';
import { IDSResult, runIDS } from '../shared/main/ids-processor';

export interface DataQuadSnapshot {
  temporal: string[];
  contextual: string[];
  affective: string[];
  reflective: string[];
}

export interface OpenClawEvent {
  agentId: string;
  sessionId: string;
  requestId: string;
  prompt: string;
  toolIntent?: string;
  metadata?: Record<string, unknown>;
  dataquad?: Partial<DataQuadSnapshot>;
}

export interface OpenClawAdapterOptions {
  hashPrompt?: boolean;
}

export interface OpenClawLogEntry {
  ts: string;
  agent_id: string;
  session_id: string;
  request_id: string;
  gate: GateResult;
  ids?: IDSResult;
  input: {
    prompt_hash?: string;
    tool_intent?: string;
    metadata?: Record<string, unknown>;
  };
  dataquad: DataQuadSnapshot;
}

const emptyDataQuad: DataQuadSnapshot = {
  temporal: [],
  contextual: [],
  affective: [],
  reflective: [],
};

const hashPrompt = (prompt: string): string => {
  return `sha256:${createHash('sha256').update(prompt).digest('hex')}`;
};

export const buildDataQuadSnapshot = (event: OpenClawEvent): DataQuadSnapshot => {
  return {
    temporal: event.dataquad?.temporal ?? emptyDataQuad.temporal,
    contextual: event.dataquad?.contextual ?? emptyDataQuad.contextual,
    affective: event.dataquad?.affective ?? emptyDataQuad.affective,
    reflective: event.dataquad?.reflective ?? emptyDataQuad.reflective,
  };
};

export const buildOpenClawLogEntry = (
  event: OpenClawEvent,
  gate: GateResult,
  ids?: IDSResult,
  options: OpenClawAdapterOptions = {}
): OpenClawLogEntry => {
  const shouldHash = options.hashPrompt ?? true;

  return {
    ts: new Date().toISOString(),
    agent_id: event.agentId,
    session_id: event.sessionId,
    request_id: event.requestId,
    gate,
    ids,
    input: {
      prompt_hash: shouldHash ? hashPrompt(event.prompt) : undefined,
      tool_intent: event.toolIntent,
      metadata: event.metadata,
    },
    dataquad: buildDataQuadSnapshot(event),
  };
};

export const processOpenClawEvent = (
  event: OpenClawEvent,
  options: OpenClawAdapterOptions = {}
): OpenClawLogEntry => {
  const gateResult = discernmentGate(event.prompt);
  const idsResult = gateResult.admitted ? runIDS(gateResult.payload as string) : undefined;

  return buildOpenClawLogEntry(event, gateResult, idsResult, options);
};
