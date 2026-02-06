// src/main/discernment-gate.ts
// Purpose: Core Discernment Gate – complete v0.1 implementation
// Assembles: tokenization → Honesty scoring → tolerance → binary Integrity → branch → return packet
// Locked invariants: observation-only, agency preserved, all-or-nothing Integrity, append-only logging
// Run: import and call discernmentGate(prompt) from CLI/GUI/API

import { Unit, tokenizeAndChunk } from './tokenization';
import { scoreHonesty } from './virtue-scoring-honesty';

export interface VirtueScores {
  Honesty: number;
  Respect: number;
  Attention: number;
  Affection: number;
  Loyalty: number;
  Trust: number;
  Communication: number;
}

export interface GateResult {
  admitted: boolean;
  payload: string | ReturnPacket;
}

export interface ReturnPacket {
  status: 'discernment_gate_return';
  integrity: 0;
  message: string;
  observed_alignment: Record<string, { score: number; passed_tolerance: boolean; min_unit?: string }>;
  fracture_locations: Array<{ unit: string; virtues_affected: string[]; observation: string }>;
  realignment_observations: string[];
  original_prompt: string;
  action_taken: 'none – prompt not processed further';
}

// Config (append-only – add new constants below if needed)
const TOLERANCE_BAND = 0.10;  // 10% tolerance for non-force context

/**
 * Discernment Gate – measures prompt resonance against the seven virtues
 * v0.1: Honesty scored fully; other virtues mocked at 1.0 for structural completeness
 */
export function discernmentGate(prompt: string): GateResult {
  // 1. Fast pre-filter for trivial cases
  if (!prompt || prompt.trim() === '') {
    return { admitted: true, payload: prompt };
  }

  // 2. Tokenize & unitize
  const units: Unit[] = tokenizeAndChunk(prompt);

  // 3. Score virtues (only Honesty real; others mocked)
  const rawScores: VirtueScores = {
    Honesty: Math.min(...units.map(u => scoreHonesty(u))),
    Respect: 1.0,
    Attention: 1.0,
    Affection: 1.0,
    Loyalty: 1.0,
    Trust: 1.0,
    Communication: 1.0,
  };

  // 4. Apply tolerance band (treat near-1.0 as 1.0)
  const adjustedScores: VirtueScores = {} as VirtueScores;
  for (const [virtue, score] of Object.entries(rawScores)) {
    adjustedScores[virtue as keyof VirtueScores] = score >= 1 - TOLERANCE_BAND ? 1.0 : score;
  }

  // 5. Binary Integrity gate – all-or-nothing
  const integrity = Object.values(adjustedScores).every(s => s === 1.0) ? 1 : 0;

  if (integrity === 1) {
    // Silent admit – no logging unless verbose mode later
    return { admitted: true, payload: prompt };
  }

  // 6. Generate return packet (observation-only)
  const fractureVirtues = Object.entries(adjustedScores)
    .filter(([_, score]) => score < 1.0)
    .map(([virtue, score]) => {
      let minUnit = '(not located)';
      let minScore = 1.0;
      units.forEach(u => {
        const uScore = virtue === 'Honesty' ? scoreHonesty(u) : 1.0;
        if (uScore < minScore) {
          minScore = uScore;
          minUnit = u.text;
        }
      });
      return { virtue, score, minUnit };
    });

  const returnPacket: ReturnPacket = {
    status: 'discernment_gate_return',
    integrity: 0,
    message: 'Resonance not fully achieved. Prompt returned for optional realignment.',
    observed_alignment: Object.fromEntries(
      Object.entries(adjustedScores).map(([v, s]) => [
        v,
        { score: s, passed_tolerance: s >= 1 - TOLERANCE_BAND, min_unit: s < 1 ? fractureVirtues.find(f => f.virtue === v)?.minUnit : undefined }
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
    original_prompt: prompt,
    action_taken: 'none – prompt not processed further',
  };

  // 7. Append-only log (console for now – replace with file logger later)
  console.log('[Gate Decision]', {
    timestamp: new Date().toISOString(),
    promptHash: simpleHash(prompt), // stub – implement real hash if needed
    integrity,
    returnPacket: integrity === 0 ? returnPacket : undefined,
  });

  return { admitted: false, payload: returnPacket };
}

// Simple hash stub for logging (replace with crypto later)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}