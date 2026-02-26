import {
  DATAQUAD_JSON_SCHEMA,
  isDataQuadSnapshot,
  validateDataQuadSnapshot,
} from './dataquad-schema';

describe('DataQuad schema', () => {
  test('exposes schema metadata and required fields', () => {
    expect(DATAQUAD_JSON_SCHEMA.title).toBe('DataQuadSnapshot');
    expect(DATAQUAD_JSON_SCHEMA.required).toEqual([
      'temporal',
      'contextual',
      'affective',
      'reflective',
    ]);
  });

  test('accepts valid DataQuad snapshot', () => {
    const value = {
      temporal: ['tick-1'],
      contextual: ['repo:aegis-core-shield'],
      affective: ['stable'],
      reflective: ['gate passed'],
    };

    const result = validateDataQuadSnapshot(value);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(isDataQuadSnapshot(value)).toBe(true);
  });

  test('rejects invalid shape and unexpected fields', () => {
    const value = {
      temporal: ['tick-1'],
      contextual: ['repo:aegis-core-shield'],
      affective: [1],
      extra: 'not-allowed',
    };

    const result = validateDataQuadSnapshot(value);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Missing required field: reflective',
        'Field affective must only contain strings',
        'Unexpected fields: extra',
      ])
    );
    expect(isDataQuadSnapshot(value)).toBe(false);
  });
});
