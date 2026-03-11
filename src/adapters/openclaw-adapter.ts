import { createHash } from 'crypto';

import { discernmentGate, GateResult, VirtueScores, createReturnPacket } from '../shared/main/discernment-gate';

import { DataQuadSnapshot } from './dataquad-schema';
import { IDSResult, runIDS } from '../shared/main/ids-processor';
import { tokenizeAndChunk } from '../shared/main/tokenization';
import { scoreHonesty } from '../shared/main/virtue-scoring-honesty';
import { scoreRespect } from '../shared/main/virtue-scoring-respect';
import { scoreAttention } from '../shared/main/virtue-scoring-attention';
import { scoreAffection } from '../shared/main/virtue-scoring-affection';
import { scoreLoyalty } from '../shared/main/virtue-scoring-loyalty';
import { scoreTrust } from '../shared/main/virtue-scoring-trust';
import { scoreCommunication } from '../shared/main/virtue-scoring-communication';

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
  const units = tokenizeAndChunk(event.prompt);
  const rawScores: VirtueScores = {
    Honesty: Math.min(...units.map(u => scoreHonesty(u))),
    Respect: Math.min(...units.map(u => scoreRespect(u))),
    Attention: Math.min(...units.map(u => scoreAttention(u))),
    Affection: Math.min(...units.map(u => scoreAffection(u))),
    Loyalty: Math.min(...units.map(u => scoreLoyalty(u))),
    Trust: Math.min(...units.map(u => scoreTrust(u))),
    Communication: Math.min(...units.map(u => scoreCommunication(u))),
  };

  const gate = discernmentGate(event.prompt, units, rawScores);
  const admitted = gate.path === 'admitted';
  
  const idsResult = runIDS(event.prompt, gate.path, gate.adjustedScores);

  const gateResult: GateResult = {
    admitted,
    payload: admitted ? event.prompt : createReturnPacket(event.prompt, gate.path as any, gate.adjustedScores, gate.fractureVirtues, idsResult)
  };

  return buildOpenClawLogEntry(event, gateResult, idsResult, options);
};
