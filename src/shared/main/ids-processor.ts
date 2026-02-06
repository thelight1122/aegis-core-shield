// src/shared/main/ids-processor.ts
// Purpose: IDS (Identify, Define, Suggest) processor for admitted prompts
// Three-phase processing: observation → definition → suggestion
// Observation-only language, no judgments, preserves user agency

import { discernmentGate, ReturnPacket } from './discernment-gate';

export interface IDSResult {
    phase: 'identify' | 'define' | 'suggest';
    input: string;
    output: string;
    observations: string[];
    timestamp: string;
}

/**
 * Phase 1: Identify
 * Observes key elements in the prompt without interpretation
 */
export function identify(prompt: string): IDSResult {
    const observations: string[] = [];

    // Detect question vs. statement
    if (prompt.includes('?')) {
        observations.push('Prompt contains interrogative structure');
    } else {
        observations.push('Prompt contains declarative structure');
    }

    // Detect temporal markers
    const temporalMarkers = ['now', 'today', 'tomorrow', 'yesterday', 'soon', 'later'];
    const foundMarkers = temporalMarkers.filter(marker =>
        prompt.toLowerCase().includes(marker)
    );
    if (foundMarkers.length > 0) {
        observations.push(`Temporal markers present: ${foundMarkers.join(', ')}`);
    }

    // Word count observation
    const wordCount = prompt.split(/\s+/).length;
    observations.push(`Prompt length: ${wordCount} words`);

    return {
        phase: 'identify',
        input: prompt,
        output: prompt, // Pass through unchanged
        observations,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Phase 2: Define
 * Provides structural definition of identified elements
 */
export function define(identifyResult: IDSResult): IDSResult {
    const observations: string[] = [...identifyResult.observations];

    // Analyze prompt structure
    const sentences = identifyResult.input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    observations.push(`Structural composition: ${sentences.length} sentence(s)`);

    // Detect action verbs (basic heuristic)
    const actionVerbs = ['create', 'build', 'make', 'update', 'delete', 'fix', 'analyze'];
    const foundActions = actionVerbs.filter(verb =>
        identifyResult.input.toLowerCase().includes(verb)
    );
    if (foundActions.length > 0) {
        observations.push(`Action indicators: ${foundActions.join(', ')}`);
    }

    return {
        phase: 'define',
        input: identifyResult.input,
        output: identifyResult.output,
        observations,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Phase 3: Suggest
 * Offers optional pathways based on observations (no enforcement)
 */
export function suggest(defineResult: IDSResult): IDSResult {
    const observations: string[] = [...defineResult.observations];
    const suggestions: string[] = [];

    // Generate non-directive suggestions
    if (defineResult.input.includes('?')) {
        suggestions.push('Observed: interrogative form - information retrieval pathway available');
    }

    if (defineResult.observations.some(obs => obs.includes('Action indicators'))) {
        suggestions.push('Observed: action verbs present - task execution pathway available');
    }

    // Default suggestion
    suggestions.push('Direct processing pathway available');

    observations.push(...suggestions);

    return {
        phase: 'suggest',
        input: defineResult.input,
        output: defineResult.output,
        observations,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Run complete IDS pipeline
 */
export function runIDS(prompt: string): IDSResult {
    const identified = identify(prompt);
    const defined = define(identified);
    const suggested = suggest(defined);
    return suggested;
}

export type ProcessPromptResult = IDSResult | ReturnPacket;

/**
 * Gate-aware entrypoint for CLI/GUI/API flows.
 */
export function processPrompt(rawPrompt: string): ProcessPromptResult {
    const gateResult = discernmentGate(rawPrompt);
    if (gateResult.admitted) {
        return runIDS(gateResult.payload as string);
    }
    return gateResult.payload as ReturnPacket;
}
