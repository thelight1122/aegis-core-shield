import { identify, define, suggest } from './ids-processor';

describe('IDS Processor – Unit Tests (I-09)', () => {

    test('Identify phase: observes interrogative structure and active intent', () => {
        const prompt = "What is the AEGIS Core Shield?";
        const result = identify(prompt);
        expect(result.observations).toContain('Prompt contains interrogative structure');
        expect(result.observations).toContain('Intent Profile: active');
        expect(result.observations).toContain('Potential entities observed: AEGIS, Core, Shield');
        expect(result.observations).toContain('Virtue Tie-Back: Honesty is aligned');
        expect(result.observations).toContain('Virtue Tie-Back: Respect is aligned');
        expect(result.observations).toContain('Virtue Tie-Back: Attention is aligned');
        expect(result.observations).toContain('Virtue Tie-Back: Affection is aligned');
        expect(result.observations).toContain('Virtue Tie-Back: Loyalty is aligned');
        expect(result.observations).toContain('Virtue Tie-Back: Trust is aligned');
        expect(result.observations).toContain('Virtue Tie-Back: Communication is aligned');
    });

    test('Identify phase: detects descriptive profile', () => {
        const prompt = "The field is calm.";
        const result = identify(prompt);
        expect(result.observations).toContain('Intent Profile: descriptive');
    });

    test('Identify phase: detects high imperative signal', () => {
        const highForce = "you must run the fix right now immediately";
        const result = identify(highForce);
        expect(result.observations).toContain('Structural Signal: high imperative weight observed');
        expect(result.analysis?.intent.imperative).toBe(true);
    });

    test('Define phase: observes structural composition and entity mapping', () => {
        const prompt = "What is Aegis?";
        const idResult = identify(prompt);
        const result = define(idResult);
        expect(result.observations.some(obs => obs.includes('Structural composition: 1 sentence(s)'))).toBe(true);
        expect(result.observations).toContain('Pattern: Entity-centric inquiry');
    });

    test('Define phase: observes action indicators', () => {
        const prompt = "Build the module.";
        const idResult = identify(prompt);
        const result = define(idResult);
        expect(result.observations.some(obs => obs.includes('Action indicators: build'))).toBe(true);
        expect(result.observations).toContain('Pattern: General directive proposal');
    });

    test('Suggest phase: provides granular pathways', () => {
        const prompt = "What is Aegis?";
        const defResult = define(identify(prompt));
        const result = suggest(defResult, 'admitted');
        expect(result.observations).toContain('Pathway: Information retrieval sequence available');
        expect(result.observations).toContain('Direct processing pathway engaged');
    });

    test('Suggest phase: detect high-force return pathways', () => {
        const highForce = "you must run the fix right now";
        const idResult = identify(highForce);
        const defResult = define(idResult);
        const result = suggest(defResult, 'deep-return');
        expect(result.observations).toContain('Mirror: Reflection engine available for high-force signals');
    });
});
