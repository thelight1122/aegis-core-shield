// src/main/discernment-gate.ts

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

// Configurable constants (append-only)
const TOLERANCE_BAND = 0.10;  // 10% tolerance for non-force context

/**
 * Main Discernment Gate – measures prompt resonance against the seven virtues
 */
export function discernmentGate(prompt: string): GateResult {
  // 1. Fast pre-filter
  if (!prompt || prompt.trim() === '') {
    return { admitted: true, payload: prompt }; // trivial, admit
  }

  // 2. Tokenize & unitize
  const units: Unit[] = tokenizeAndChunk(prompt);

  // 3. Score virtues (Honesty real; others mocked at 1.0 for v0.1)
  const rawScores: VirtueScores = {
    Honesty: Math.min(...units.map(u => scoreHonesty(u))),
    Respect: 1.0,
    Attention: 1.0,
    Affection: 1.0,
    Loyalty: 1.0,
    Trust: 1.0,
    Communication: 1.0,
  };

  // 4. Apply tolerance band – treat as 1.0 if within tolerance
  const adjustedScores: VirtueScores = {} as VirtueScores;
  for (const [virtue, score] of Object.entries(rawScores)) {
    adjustedScores[virtue as keyof VirtueScores] = score >= 1 - TOLERANCE_BAND ? 1.0 : score;
  }

  // 5. Binary Integrity gate (all-or-nothing)
  const integrity = Object.values(adjustedScores).every(s => s === 1.0) ? 1 : 0;

  if (integrity === 1) {
    // Silent admit
    return { admitted: true, payload: prompt };
  }

  // 6. Generate return packet (observation only)
  const fractureVirtues = Object.entries(adjustedScores)
    .filter(([_, score]) => score < 1.0)
    .map(([virtue, score]) => ({
      virtue,
      score,
      minUnit: units.reduce((minU, u) => {
        const uScore = virtue === 'Honesty' ? scoreHonesty(u) : 1.0;
        return uScore < (minU?.score ?? 1.1) ? { unit: u.text, score: uScore } : minU;
      }, null as { unit: string; score: number } | null)?.unit,
    }));

  const returnPacket: ReturnPacket = {
    status: 'discernment_gate_return',
    integrity: 0,
    message: 'Resonance not fully achieved. Prompt returned for optional realignment.',
    observed_alignment: Object.fromEntries(
      Object.entries(adjustedScores).map(([v, s]) => [v, { score: s, passed_tolerance: s >= 1 - TOLERANCE_BAND }])
    ),
    fracture_locations: fractureVirtues.map(f => ({
      unit: f.minUnit || '(not located)',
      virtues_affected: [f.virtue],
      observation: 'score below threshold after tolerance',
    })),
    realignment_observations: fractureVirtues.map(f => 
      `For ${f.virtue}: consider adjusting phrasing where score dropped`
    ),
    original_prompt: prompt,
    action_taken: 'none – prompt not processed further',
  };

  // 7. Append-only log (stub – implement real logger later)
  console.log('[Gate Log]', { timestamp: new Date().toISOString(), returnPacket });

  return { admitted: false, payload: returnPacket };
}