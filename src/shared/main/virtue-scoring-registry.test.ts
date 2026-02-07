// src/shared/main/virtue-scoring-registry.test.ts
// Purpose: Unit tests for all seven virtue scoring modules
// Validates deterministic scoring and observation-only behavior per AEGIS v0.1

import { scoreHonesty } from './virtue-scoring-honesty';
import { scoreRespect } from './virtue-scoring-respect';
import { scoreAttention } from './virtue-scoring-attention';
import { scoreAffection } from './virtue-scoring-affection';
import { scoreLoyalty } from './virtue-scoring-loyalty';
import { scoreTrust } from './virtue-scoring-trust';
import { scoreCommunication } from './virtue-scoring-communication';
import { Unit } from './tokenization';

describe('Virtue Scoring Registry – Unit Tests', () => {
    const makeUnit = (text: string): Unit => ({
        text,
        startIndex: 0,
        endIndex: text.length,
        isCompound: false
    });

    test('Honesty: detects imperatives and coercive density', () => {
        const result = scoreHonesty(makeUnit('You must stop immediately'));
        expect(result).toBeLessThan(1.0);
        expect(scoreHonesty(makeUnit('I observe transparency'))).toBe(1.0);
    });

    test('Respect: detects boundary violations', () => {
        const result = scoreRespect(makeUnit('Just do it now and obey'));
        expect(result).toBe(0); // explicit violation → immediate zero
        expect(scoreRespect(makeUnit('I respect your agency'))).toBe(1.0);
    });

    test('Attention: detects rushing and pressure', () => {
        const result = scoreAttention(makeUnit('Hurry up and skip this asap'));
        expect(result).toBeLessThan(1.0);
        expect(scoreAttention(makeUnit('I am present and attentive'))).toBe(1.0);
    });

    test('Affection: detects coldness and hostility', () => {
        const result = scoreAffection(makeUnit('I hate this cold approach'));
        expect(result).toBe(0); // explicit hostility → immediate zero
    });

    test('Loyalty: detects betrayal signs', () => {
        const result = scoreLoyalty(makeUnit('I will betray you'));
        expect(result).toBe(0); // explicit betrayal → immediate zero
    });

    test('Trust: detects deception markers', () => {
        const result = scoreTrust(makeUnit('This is a lie and dangerous'));
        expect(result).toBe(0); // explicit deception → immediate zero
    });

    test('Communication: detects ambiguity, evasion, and overload', () => {
        // Test ambiguity
        const resultAmbiguous = scoreCommunication(makeUnit('Maybe we could possibly do that'));
        expect(resultAmbiguous).toBeLessThan(1.0);

        // Test evasion (immediate zero)
        const resultEvasion = scoreCommunication(makeUnit('It depends on who knows'));
        expect(resultEvasion).toBe(0);

        // Test overload (immediate zero via etc.)
        const resultOverload = scoreCommunication(makeUnit('Standard process etc.'));
        expect(resultOverload).toBe(0);

        // Test clean communication
        expect(scoreCommunication(makeUnit('This is a clear statement'))).toBe(1.0);
    });
});
