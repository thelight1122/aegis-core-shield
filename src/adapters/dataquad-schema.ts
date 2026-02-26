export interface DataQuadSnapshot {
  temporal: string[];
  contextual: string[];
  affective: string[];
  reflective: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Draft JSON Schema for DataQuad snapshots.
 * Kept as a plain object to avoid adding external validation dependencies.
 */
export const DATAQUAD_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://aegis-core-shield.dev/schemas/dataquad-snapshot.json',
  title: 'DataQuadSnapshot',
  type: 'object',
  additionalProperties: false,
  required: ['temporal', 'contextual', 'affective', 'reflective'],
  properties: {
    temporal: {
      type: 'array',
      items: { type: 'string' },
      description: 'Time-ordered events, intervals, or recurrence markers',
    },
    contextual: {
      type: 'array',
      items: { type: 'string' },
      description: 'Workspace, dependency, and tool-context signals',
    },
    affective: {
      type: 'array',
      items: { type: 'string' },
      description: 'Affect or sentiment resonance markers',
    },
    reflective: {
      type: 'array',
      items: { type: 'string' },
      description: 'Self-observed outcomes, lessons, and constraints',
    },
  },
} as const;

const REQUIRED_KEYS: ReadonlyArray<keyof DataQuadSnapshot> = [
  'temporal',
  'contextual',
  'affective',
  'reflective',
];

export const isDataQuadSnapshot = (value: unknown): value is DataQuadSnapshot => {
  return validateDataQuadSnapshot(value).valid;
};

export const validateDataQuadSnapshot = (value: unknown): ValidationResult => {
  const errors: string[] = [];

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['DataQuad must be an object'] };
  }

  const recordValue = value as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (!(key in recordValue)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    const fieldValue = recordValue[key];
    if (!Array.isArray(fieldValue)) {
      errors.push(`Field ${key} must be an array`);
      continue;
    }

    if (!fieldValue.every((item) => typeof item === 'string')) {
      errors.push(`Field ${key} must only contain strings`);
    }
  }

  const unexpectedKeys = Object.keys(recordValue).filter(
    (key) => !REQUIRED_KEYS.includes(key as keyof DataQuadSnapshot)
  );

  if (unexpectedKeys.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedKeys.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
