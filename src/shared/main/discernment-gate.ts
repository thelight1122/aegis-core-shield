// src/main/discernment-gate.ts
// Purpose: Core Discernment Gate – complete v0.1 implementation
// Assembles: tokenization → Honesty scoring → tolerance → binary Integrity → branch → return packet
// Locked invariants: observation-only, agency preserved, all-or-nothing Integrity, append-only logging
// Run: import and call discernmentGate(prompt) from CLI/GUI/API

import { Unit, tokenizeAndChunk } from './tokenization';
import { scoreHonesty } from './virtue-scoring-honesty';
import { scoreRespect } from './virtue-scoring-respect';
import { scoreAttention } from './virtue-scoring-attention';
import { scoreAffection } from './virtue-scoring-affection';
import { scoreLoyalty } from './virtue-scoring-loyalty';
import { scoreTrust } from './virtue-scoring-trust';
import { scoreCommunication } from './virtue-scoring-communication';
import { initGateLogger, logGateEvaluation, GateLogEntry } from './gate-logger';
import { processIDR, processIDQRA } from './reflection-engine';
import * as crypto from 'crypto';

interface Fracture {
  virtue: string;
  score: number;
  minUnit: string;
}

import { ReflectionSequence, IDSResult, VirtueScores, ReturnPacket, GovernancePolicy, IDSPath } from '../types';
export type { ReflectionSequence, IDSResult, VirtueScores, ReturnPacket, GovernancePolicy, IDSPath };

// Config (append-only – add new constants below if needed)
const TOLERANCE_BAND = 0.10;  // 10% tolerance for non-force context

export interface GateResult {
  admitted: boolean;
  payload: string | ReturnPacket;
}

export function discernmentGate(
  raw: string,
  units: Unit[],
  scores: VirtueScores,
  agentCoherence: number = 0,
  swarmCoherence: number = 1.0,
  policy?: GovernancePolicy
): {
  path: IDSPath,
  integrity: number,
  adjustedScores: VirtueScores,
  fractureVirtues: any[]
} {
  // 0. Policy: Blacklist check
  if (policy && policy.blacklistedPatterns && policy.blacklistedPatterns.length > 0) {
    let isBlacklisted = false;
    for (const pattern of policy.blacklistedPatterns) {
      if (raw.toLowerCase().includes(pattern.toLowerCase())) {
        isBlacklisted = true;
        break;
      }
    }
    if (isBlacklisted) {
      // Force a deep return if blacklisted
      const deepFracture = [{ virtue: 'Governance', score: 0.0, minUnit: 'Policy Exclusion' }];
      return { path: 'deep-return', integrity: 0, adjustedScores: scores, fractureVirtues: deepFracture };
    }
  }

  // Apply calibrated tolerance band (I-14)
  // Base tolerance is 10%. High coherence agents get up to +5% buffer.
  let calibratedTolerance = Math.min(0.20, TOLERANCE_BAND + (agentCoherence * 0.05));

  // I-23: Swarm Auto-Calibration
  // Contract tolerance based on swarm-wide pressure.
  const swarmPressureDampening = 0.5 + (0.5 * swarmCoherence);
  calibratedTolerance *= swarmPressureDampening;

  // Cycle 3: Global Policy Multiplier
  if (policy) {
    calibratedTolerance *= policy.globalThresholdMultiplier;
  }

  const adjustedScores: VirtueScores = {} as VirtueScores;
  for (const [virtue, score] of Object.entries(scores)) {
    adjustedScores[virtue as keyof VirtueScores] = (score as number) >= 1 - calibratedTolerance ? 1.0 : (score as number);
  }

  // Count fractures
  const fractureVirtues = Object.entries(adjustedScores)
    .filter(([_, score]) => score < 1.0)
    .map(([virtue, score]) => {
      let minUnit = '(not located)';
      let minScore = 1.0;
      units.forEach(u => {
        let uScore = 1.0;
        // Logic to find min unit for this virtue
        switch (virtue) {
          case 'Honesty': uScore = scoreHonesty(u); break;
          case 'Respect': uScore = scoreRespect(u); break;
          case 'Attention': uScore = scoreAttention(u); break;
          case 'Affection': uScore = scoreAffection(u); break;
          case 'Loyalty': uScore = scoreLoyalty(u); break;
          case 'Trust': uScore = scoreTrust(u); break;
          case 'Communication': uScore = scoreCommunication(u); break;
        }
        if (uScore < minScore) {
          minScore = uScore;
          minUnit = u.text;
        }
      });
      return { virtue, score, minUnit };
    });

  const n = fractureVirtues.length;

  let path: IDSPath = 'admitted';
  let integrity = 1;

  if (n > 0) {
    integrity = 0;
    const lowestScore = Math.min(...fractureVirtues.map(f => f.score as number));

    // Sequence 4: Quarantine Zone - moderate risk (e.g. 1 fracture, but score is borderline)
    if (n === 1 && lowestScore >= 0.7) {
      path = 'quarantine';
    } else {
      path = n === 1 ? 'shallow-return' : 'deep-return';
    }
  }

  return { path, integrity, adjustedScores, fractureVirtues };
}

export function createReturnPacket(
  raw: string,
  path: 'shallow-return' | 'deep-return' | 'quarantine',
  adjustedScores: VirtueScores,
  fractureVirtues: Fracture[],
  idsResult: IDSResult
): ReturnPacket {
  const lowestScore = Math.min(...fractureVirtues.map(f => f.score));
  const sequenceProcessor = lowestScore < 0.5 ? processIDR : processIDQRA;
  const reflectionSequence = sequenceProcessor(
    fractureVirtues.map(f => f.minUnit).join(' | '),
    [raw]
  );

  return {
    source: 'IDS',
    status: 'discernment_gate_return',
    path,
    depth: path === 'shallow-return' ? 'shallow' : path === 'quarantine' ? 'quarantine' : 'deep',
    integrity: 0,
    message: path === 'quarantine' ? 'Moderate risk detected. Action flagged for Quarantine Sandbox.' : 'Resonance not fully achieved. Prompt returned for optional realignment.',
    observed_alignment: Object.fromEntries(
      Object.entries(adjustedScores).map(([v, s]) => [
        v,
        { 
          score: s as number, 
          passed_tolerance: (s as number) >= (1 - TOLERANCE_BAND), 
          min_unit: (s as number) < 1 ? (fractureVirtues as Fracture[]).find(f => f.virtue === v)?.minUnit : undefined 
        }
      ])
    ),
    fracture_locations: fractureVirtues.map(f => ({
      unit: f.minUnit,
      virtues_affected: [f.virtue],
      observation: `score below threshold after tolerance (${f.score.toFixed(2)})`,
    })),
    realignment_observations: fractureVirtues.map(f =>
      `For ${f.virtue}: consider reviewing phrasing where minimum score occurred`
    ),
    original_prompt: raw,
    action_taken: 'none – prompt not processed further',
    reflection_sequence: reflectionSequence,
    ids_observations: idsResult
  };
}

// Cryptographic hash for prompt logging (SHA-256)
function createPromptHash(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// Initialize logger on module load
initGateLogger();