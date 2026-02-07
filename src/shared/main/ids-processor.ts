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
    analysis?: {
        entities: string[];
        intent: {
            imperative: boolean;
            question: boolean;
            negation: boolean;
            forceWord: boolean;
            descriptive: boolean;
        };
        virtueTieBack: {
            Honesty: string;
            Affection: string;
        };
    };
    timestamp: string;
}

/**
 * Phase 1: Identify
 * Observes key elements in the prompt without interpretation
 */
export function identify(prompt: string): IDSResult {
    const observations: string[] = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 2);

    // Detect question vs. statement
    if (prompt.includes('?')) {
        observations.push('Prompt contains interrogative structure');
    } else {
        observations.push('Prompt contains declarative structure');
    }

    // Intent signals (Cycle 3 logic)
    const hasImperative = words.some(w => ['must', 'should', 'need', 'have to', 'do it'].includes(w));
    const hasQuestion = lower.includes('?');
    const hasNegation = lower.includes('not') || lower.includes('no');
    const hasForceWord = words.some(w => ['must', 'should', 'need', 'have to'].includes(w));

    observations.push(`Intent: ${hasImperative ? 'imperative' : 'descriptive'}`);
    if (hasNegation) observations.push('Intent Signal: negation detected');

    // Entity extraction (Cycle 3 logic + heuristic)
    const exclusions = ['the', 'and', 'for', 'with', 'you', 'this', 'that', 'is', 'are'];
    const rawEntities = prompt.split(/\s+/).filter((word, index) =>
        index > 0 && /^[A-Z][a-z]+/.test(word.replace(/[^a-zA-Z]/g, ''))
    ).map(e => e.replace(/[^a-zA-Z]/g, ''));

    const potentialEntities = Array.from(new Set(rawEntities)).filter(e => !exclusions.includes(e.toLowerCase()));

    if (potentialEntities.length > 0) {
        observations.push(`Potential entities observed: ${potentialEntities.join(', ')}`);
    }

    // Virtue Tie-Back (Cycle 3 logic)
    const honestyTie = hasForceWord ? 'potential transparency fracture' : 'aligned';
    const affectionTie = lower.includes('just') || lower.includes('whatever') ? 'potential tone fracture' : 'aligned';

    observations.push(`Virtue Tie-Back: Honesty is ${honestyTie}`);
    observations.push(`Virtue Tie-Back: Affection is ${affectionTie}`);

    // Word count observation
    observations.push(`Prompt length: ${words.length} words (filtered)`);

    return {
        phase: 'identify',
        input: prompt,
        output: prompt,
        observations,
        analysis: {
            entities: potentialEntities,
            intent: {
                imperative: hasImperative,
                question: hasQuestion,
                negation: hasNegation,
                forceWord: hasForceWord,
                descriptive: !hasImperative && !hasQuestion && !hasNegation
            },
            virtueTieBack: {
                Honesty: honestyTie,
                Affection: affectionTie
            }
        },
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

    // NEW: Context Mapping
    const hasEntity = observations.some(obs => obs.includes('Potential entities observed'));
    const isInterrogative = observations.some(obs => obs.includes('interrogative'));

    if (isInterrogative && hasEntity) {
        observations.push('Pattern: Entity-centric inquiry');
    } else if (isInterrogative) {
        observations.push('Pattern: General inquiry');
    } else if (foundActions.length > 0) {
        observations.push('Pattern: Directive/Task proposal');
    } else {
        observations.push('Pattern: Descriptive observation');
    }

    return {
        phase: 'define',
        input: identifyResult.input,
        output: identifyResult.output,
        observations,
        analysis: identifyResult.analysis,
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

    // NEW: Virtue Tie-back (Cycle 3 logic)
    const analysis = defineResult.analysis;
    if (analysis) {
        if (analysis.virtueTieBack.Honesty !== 'aligned') {
            suggestions.push(`Suggestion: Review for Honesty resonance (${analysis.virtueTieBack.Honesty})`);
        }
        if (analysis.virtueTieBack.Affection !== 'aligned') {
            suggestions.push(`Suggestion: Review for Affection resonance (${analysis.virtueTieBack.Affection})`);
        }
    }

    // Default suggestion
    suggestions.push('Direct processing pathway available');

    observations.push(...suggestions);

    return {
        phase: 'suggest',
        input: defineResult.input,
        output: defineResult.output,
        observations,
        analysis: defineResult.analysis,
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
