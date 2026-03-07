import { processIDR, processIDQRA } from './reflection-engine';

describe('Reflection Engine (I-10)', () => {
    const signal = 'you must do this';
    const context = ['CLI_SESSION'];

    test('processIDR produces strictly structural identify stage', () => {
        const result = processIDR(signal, context);
        expect(result.stages[0].content).toContain('Signal topology observed');
        expect(result.stages[1].content).toContain('Boundary tension detected');
        expect(result.stages[2].content).toContain('High-force signal patterns');
    });

    test('processIDQRA produces observational stages without valence', () => {
        const result = processIDQRA(signal, context);
        expect(result.stages[1].content).toContain('Observing structural presence');
        expect(result.stages[2].content).toContain('Notice the structural presence');
        expect(result.stages[3].content).toContain('Observing without valence');
        expect(result.stages[4].content).toContain('pattern is present');
    });

    test('reflection sequences should not contain interpretative terms', () => {
        const result = processIDQRA(signal, context);
        const allContent = result.stages.map(s => s.content.toLowerCase()).join(' ');
        expect(allContent).not.toContain('evaluating');
        expect(allContent).not.toContain('necessity');
        expect(allContent).not.toContain('emotional');
    });
});
