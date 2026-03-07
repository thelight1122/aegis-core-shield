import { createHash } from 'crypto';

import { discernmentGate, GateResult, ReturnPacket } from '../shared/main/discernment-gate';

import { DataQuadSnapshot } from './dataquad-schema';
import { IDSResult, runIDS } from '../shared/main/ids-processor';

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
  return createHash('sha256').update(prompt).digest('hex').substring(0, 16);
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

import { processPrompt } from '../shared/main/ids-processor';

export const processOpenClawEvent = async (
  event: OpenClawEvent,
  options: OpenClawAdapterOptions = {}
): Promise<OpenClawLogEntry> => {
  const result = await processPrompt(event.prompt, event.agentId);

  const admitted = !('status' in result && result.status === 'discernment_gate_return');
  const gateResult: GateResult = {
    admitted,
    payload: admitted ? event.prompt : (result as ReturnPacket)
  };
  const idsResult = admitted ? (result as IDSResult) : (result as ReturnPacket).ids_observations;

  return buildOpenClawLogEntry(event, gateResult, idsResult, options);
};
