/**
 * AEGIS Core v1.0 Addendum: The Axiom of Reflection (Locked)
 *
 * OpenClaw now derives its reflection sequencing through the shared AEGIS Core
 * and adapts the output into the legacy OpenClaw reflection contract.
 */

import { buildReflectionSequence } from './core-engine-bridge';
import { ReflectionStage, ReflectionSequence } from '../types';
export type { ReflectionStage, ReflectionSequence };

/**
 * IDR - The Sequence of Illumination
 * Used for high-intensity or urgent contexts (e.g., coercion detected).
 * Shortest mirror to allow widest space for agency to re-emerge.
 */
export function processIDR(signal: string, context: string[]): ReflectionSequence {
    return buildReflectionSequence(signal, context, 'IDR');
}

/**
 * IDQRA - The Sequence of Deep Inquiry
 * Used for rested or deliberate contexts (e.g., peer reflection, self-inquiry).
 */
export function processIDQRA(signal: string, context: string[]): ReflectionSequence {
    return buildReflectionSequence(signal, context, 'IDQRA');
}
