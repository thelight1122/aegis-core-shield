/**
 * AEGIS Core v1.0 Addendum: The Axiom of Reflection (Locked)
 * 
 * Implements the IDR and IDQRA reflection sequences for non-coercive coherence recovery.
 */

export interface ReflectionStage {
    stage: 'Identify' | 'Define' | 'Question' | 'Reflect' | 'Acknowledge';
    content: string;
}

export interface ReflectionSequence {
    type: 'IDR' | 'IDQRA';
    stages: ReflectionStage[];
    timestamp: string;
}

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
                content: `Signal observed: ${signal}`
            },
            {
                stage: 'Define',
                content: `Boundary tension detected concerning structural constraints in context: ${context[context.length - 1] || 'Unknown'}.`
            },
            {
                stage: 'Reflect',
                content: `Holding mirror: This path compresses choice. Agency is reserved for self-observation without direction.`
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
                content: `Signal or drift observed: ${signal}`
            },
            {
                stage: 'Define',
                content: `Evaluating pattern in relation to Axioms/Virtues, grounded in context: ${context[context.length - 1] || 'Unknown'}.`
            },
            {
                stage: 'Question',
                content: `What structural or emotional necessity is driving this signal? What do you notice here?`
            },
            {
                stage: 'Reflect',
                content: `Holding mirror for integration. Observation without judgement.`
            },
            {
                stage: 'Acknowledge',
                content: `This signal is seen and valid within the field. No force required.`
            }
        ]
    };
}
