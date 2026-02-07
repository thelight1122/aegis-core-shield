// src/shared/main/ids-logic.test.ts
// Purpose: Unit tests for IDS (Identify, Define, Suggest) logic steps

import { identify, define, suggest, runIDS } from './ids-processor';

describe('IDS Processor – Unit Tests', () => {
    const prompt = "Can you help me build this tool soon?";

    test('Identify phase: observes interrogative structure and intent depth', () => {
        const result = identify(prompt);
        expect(result.observations).toContain('Prompt contains interrogative structure');
        expect(result.observations).toContain('Intent: descriptive');
    });

    test('Define phase: observes structural composition', () => {
        const idResult = identify(prompt);
        const result = define(idResult);
        expect(result.observations.some(obs => obs.includes('Structural composition: 1 sentence(s)'))).toBe(true);
        expect(result.observations.some(obs => obs.includes('build'))).toBe(true);
    });

    test('Suggest phase: provides non-directive pathways', () => {
        const defResult = define(identify(prompt));
        const result = suggest(defResult);
        expect(result.observations.some(obs => obs.includes('information retrieval pathway available'))).toBe(true);
        expect(result.observations.some(obs => obs.includes('Direct processing pathway available'))).toBe(true);
    });

    test('runIDS pipeline: completes all phases successfully', () => {
        const result = runIDS(prompt);
        expect(result.phase).toBe('suggest');
        expect(result.input).toBe(prompt);
    });
});
