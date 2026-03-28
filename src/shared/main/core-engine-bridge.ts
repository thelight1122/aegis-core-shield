import * as path from 'path';
import { IDSPath, ReflectionSequence } from '../types';

type IDSSequence = 'IDR' | 'IDQRA';

interface CoreFinding {
  label: string;
}

interface CorePIMResult {
  findings: CoreFinding[];
  markers: string[];
}

interface CoreCarrierResult {
  mode: 'diagnostic' | 'collaborative';
}

interface CoreIDSResult {
  sequence: IDSSequence;
  mirror: string;
  contextLabel?: string;
}

interface CoreRPCResult {
  ok: boolean;
}

interface CoreArbiterResult {
  findings: string[];
}

interface CoreEngineOutput {
  pim: CorePIMResult;
  carrier: CoreCarrierResult;
  ids: CoreIDSResult;
  rpc: CoreRPCResult;
  arbiter: CoreArbiterResult;
}

interface FractureLike {
  virtue: string;
  score: number;
  minUnit: string;
}

export interface CoreBridgeInput {
  signal: string;
  contextLabel?: string;
  markers?: string[];
  outputDraft?: string;
}

function loadCorePackage(): {
  evaluateIDS: (input: Record<string, unknown>) => CoreIDSResult;
  runAegisEngine: (input: Record<string, unknown>) => CoreEngineOutput;
} {
  const coreEntry = path.resolve(
    process.cwd(),
    '..',
    'AEGIS-CORE-ENGINE',
    'packages',
    'aegis-dataquad-core',
    'dist',
    'index.js'
  );

  return require(coreEntry) as {
    evaluateIDS: (input: Record<string, unknown>) => CoreIDSResult;
    runAegisEngine: (input: Record<string, unknown>) => CoreEngineOutput;
  };
}

export function evaluateOpenClawCore(input: CoreBridgeInput): CoreEngineOutput {
  const { runAegisEngine } = loadCorePackage();
  return runAegisEngine({
    signal: input.signal,
    markers: input.markers,
    outputDraft: input.outputDraft,
    canonVersion: 'v2.0',
    ids: {
      contextLabel: input.contextLabel
    },
    state: {
      sourceApp: 'openclaw-governance-companion'
    }
  });
}

export function buildCoreMarkers(
  path: IDSPath,
  adjustedScores?: Record<string, number>,
  fractureVirtues?: FractureLike[]
): string[] {
  const markers = new Set<string>();
  markers.add(`openclaw-path:${path}`);

  for (const [virtue, score] of Object.entries(adjustedScores ?? {})) {
    if (score < 1) {
      markers.add(`virtue-fracture:${virtue.toLowerCase()}`);
    }
  }

  for (const fracture of fractureVirtues ?? []) {
    markers.add(`fracture:${fracture.virtue.toLowerCase()}`);
    if (fracture.score < 0.5) {
      markers.add('force-language-artifact');
    }
  }

  if (path !== 'admitted') {
    markers.add('boundary-transition-observed');
  }

  return [...markers];
}

export function buildReflectionSequence(
  signal: string,
  context: string[],
  preferredSequence: IDSSequence
): ReflectionSequence {
  const { evaluateIDS } = loadCorePackage();
  const ids = evaluateIDS({
    signal,
    contextLabel: context[context.length - 1] || 'Unknown',
    envelopeMode: preferredSequence === 'IDR' ? 'diagnostic' : 'collaborative',
    urgencyLevel: preferredSequence === 'IDR' ? 0.9 : 0.2,
    fieldStability: preferredSequence === 'IDR' ? 0.3 : 0.85
  });

  if (ids.sequence === 'IDR') {
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
          content: `Boundary tension detected in structural unit grounded in context: ${ids.contextLabel || 'Unknown'}.`
        },
        {
          stage: 'Reflect',
          content: `Holding mirror: High-force signal patterns exhibit choice compression. ${ids.mirror}`
        }
      ]
    };
  }

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
        content: `Observing structural presence in relation to Axioms/Virtues, grounded in context: ${ids.contextLabel || 'Unknown'}.`
      },
      {
        stage: 'Question',
        content: 'Notice the structural presence of this signal. What do you observe about its geometry or orientation?'
      },
      {
        stage: 'Reflect',
        content: `Holding mirror for integration. Observing without valence. ${ids.mirror}`
      },
      {
        stage: 'Acknowledge',
        content: 'This signal pattern is present and valid within the structural field. Continuity maintained.'
      }
    ]
  };
}

export function summarizeCoreIntake(core: CoreEngineOutput): string[] {
  const observations: string[] = [
    `Core Envelope: ${core.carrier.mode}`,
    `Core IDS Sequence: ${core.ids.sequence}`
  ];

  if (core.pim.findings.length > 0) {
    observations.push(`Core PIM Findings: ${core.pim.findings.map((finding) => finding.label).join(', ')}`);
  } else {
    observations.push('Core PIM Findings: none observed');
  }

  if (core.arbiter.findings.length > 0) {
    observations.push(`Core Arbiter Findings: ${core.arbiter.findings.join(', ')}`);
  }

  return observations;
}
