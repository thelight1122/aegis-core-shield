import { createHash } from 'crypto';

import { createReturnPacket, discernmentGate, GateResult } from '../shared/main/discernment-gate';
import { IDSResult, runIDS } from '../shared/main/ids-processor';
import { tokenizeAndChunk } from '../shared/main/tokenization';
import { scoreAffection } from '../shared/main/virtue-scoring-affection';
import { scoreAttention } from '../shared/main/virtue-scoring-attention';
import { scoreCommunication } from '../shared/main/virtue-scoring-communication';
import { scoreHonesty } from '../shared/main/virtue-scoring-honesty';
import { scoreLoyalty } from '../shared/main/virtue-scoring-loyalty';
import { scoreRespect } from '../shared/main/virtue-scoring-respect';
import { scoreTrust } from '../shared/main/virtue-scoring-trust';
import type { VirtueScores } from '../shared/types';

import { DataQuadSnapshot } from './dataquad-schema';

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

function evaluatePrompt(prompt: string): {
  path: 'admitted' | 'shallow-return' | 'deep-return' | 'quarantine';
  adjustedScores: VirtueScores;
  fractureVirtues: Array<{ virtue: string; score: number; minUnit: string }>;
} {
  const units = tokenizeAndChunk(prompt);
  const rawScores: VirtueScores = {
    Honesty: Math.min(...units.map((unit) => scoreHonesty(unit))),
    Respect: Math.min(...units.map((unit) => scoreRespect(unit))),
    Attention: Math.min(...units.map((unit) => scoreAttention(unit))),
    Affection: Math.min(...units.map((unit) => scoreAffection(unit))),
    Loyalty: Math.min(...units.map((unit) => scoreLoyalty(unit))),
    Trust: Math.min(...units.map((unit) => scoreTrust(unit))),
    Communication: Math.min(...units.map((unit) => scoreCommunication(unit))),
  };

  const gate = discernmentGate(prompt, units, rawScores);
  return {
    path: gate.path,
    adjustedScores: gate.adjustedScores,
    fractureVirtues: gate.fractureVirtues,
  };
}

export const processOpenClawEvent = (
  event: OpenClawEvent,
  options: OpenClawAdapterOptions = {}
): OpenClawLogEntry => {
  const { path, adjustedScores, fractureVirtues } = evaluatePrompt(event.prompt);
  const admitted = path === 'admitted';
  const idsResult = runIDS(event.prompt, path, adjustedScores);

  const gateResult: GateResult = admitted
    ? {
        admitted: true,
        payload: event.prompt,
      }
    : {
        admitted: false,
        payload: createReturnPacket(event.prompt, path, adjustedScores, fractureVirtues, idsResult),
      };

  return buildOpenClawLogEntry(
    event,
    gateResult,
    admitted ? idsResult : undefined,
    options
  );
};
