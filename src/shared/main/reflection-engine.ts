/**
 * AEGIS Core v1.0 Addendum: The Axiom of Reflection (Locked)
 * 
 * Implements the IDR and IDQRA reflection sequences for non-coercive coherence recovery.
 */

import { ReflectionStage, ReflectionSequence } from '../types';
export type { ReflectionStage, ReflectionSequence };

/**
 * IDR - The Sequence of Illumination
 * Used for high-intensity or urgent contexts (e.g., coercion detected).
 * Shortest mirror to allow widest space for agency to re-emerge.
 */
export function processIDR(signal: string, context: string[]): ReflectionSequence {
    return {
        type: 'IDR',
        timestamp: new Date().toISOString(),
        stages: [
            {
                stage: 'Identify',
                content: `Signal topology observed: ${signal}`
            },
            {
                stage: 'Define',
                content: `Boundary tension detected in structural unit grounded in context: ${context[context.length - 1] || 'Unknown'}.`
            },
            {
                stage: 'Reflect',
                content: `Holding mirror: High-force signal patterns exhibit choice compression. Agency reserved for structural observation.`
            }
        ]
    };
}

/**
 * IDQRA - The Sequence of Deep Inquiry
 * Used for rested or deliberate contexts (e.g., peer reflection, self-inquiry).
 */
export function processIDQRA(signal: string, context: string[]): ReflectionSequence {
    return {
        type: 'IDQRA',
        timestamp: new Date().toISOString(),
        stages: [
            {
                stage: 'Identify',
                content: `Signal or drift pattern observed: ${signal}`
            },
            {
                stage: 'Define',
                content: `Observing structural presence in relation to Axioms/Virtues, grounded in context: ${context[context.length - 1] || 'Unknown'}.`
            },
            {
                stage: 'Question',
                content: `Notice the structural presence of this signal. What do you observe about its geometry or orientation?`
            },
            {
                stage: 'Reflect',
                content: `Holding mirror for integration. Observing without valence.`
            },
            {
                stage: 'Acknowledge',
                content: `This signal pattern is present and valid within the structural field. Continuity maintained.`
            }
        ]
    };
}
