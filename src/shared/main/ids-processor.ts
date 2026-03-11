// src/shared/main/ids-processor.ts
// Purpose: IDS (Identify, Define, Suggest) processor for admitted prompts
// Three-phase processing: observation → definition → suggestion
// Observation-only language, no judgments, preserves user agency

import { discernmentGate, createReturnPacket } from './discernment-gate';
import { ReturnPacket, VirtueScores, IDSPath, IDSResult } from '../types';
export type { ReturnPacket, VirtueScores, IDSPath, IDSResult };
import { Unit, tokenizeAndChunk } from './tokenization';
import { scoreHonesty } from './virtue-scoring-honesty';
import { scoreRespect } from './virtue-scoring-respect';
import { scoreAttention } from './virtue-scoring-attention';
import { scoreAffection } from './virtue-scoring-affection';
import { scoreLoyalty } from './virtue-scoring-loyalty';
import { scoreTrust } from './virtue-scoring-trust';
import { scoreCommunication } from './virtue-scoring-communication';
import { logGateEvaluation } from './gate-logger';
import * as dbModule from './db/database';
import { saveAgentToDb, loadAgentFromDb, loadSwarmMemories, loadSwarmLearnings, loadSwarmAffects } from './db/database';
import * as crypto from 'crypto';
import { activeGovernancePolicy } from './governance-state';


/**
 * Helper: Calculate granular intent signals from prompt units
 */
function calculateIntentSignals(prompt: string, words: string[]) {
    const lower = prompt.toLowerCase();

    // Imperative markers: direct commands or high-pressure verbs
    const imperativeWeight = words.filter(w =>
        ['must', 'should', 'need', 'have to', 'do', 'run', 'fix', 'execute', 'perform', 'make', 'create', 'update', 'delete'].includes(w)
    ).length / (words.length || 1);

    // Entity markers: abundance of specific nouns (heuristically identified by capitalization)
    const rawEntities = prompt.split(/\s+/).filter((word, index) =>
        index > 0 && /^[A-Z]+[a-z]*/.test(word.replace(/[^a-zA-Z]/g, ''))
    ).map(e => e.replace(/[^a-zA-Z]/g, ''));
    const entityDensity = rawEntities.length / (words.length || 1);

    const hasQuestion = lower.includes('?');
    const hasNegation = lower.includes('not') || lower.includes('no') || lower.includes("don't") || lower.includes("won't");

    // Descriptive check: absence of force or interrogative markers
    const isDescriptive = imperativeWeight < 0.1 && !hasQuestion;

    return {
        imperative: imperativeWeight > 0.2, // threshold for "high imperative" signal
        imperativeWeight,
        question: hasQuestion,
        negation: hasNegation,
        forceWord: imperativeWeight > 0,
        descriptive: isDescriptive,
        entityDensity,
        entities: Array.from(new Set(rawEntities))
    };
}

function calculateTopologyIndex(content: string, timestamp: string): string {
    const raw = `${content}|${timestamp}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12);
}

/**
 * Helper: Manage dataQuad entropy via pruning and summarization (I-17/I-18)
 */
function distillMemories(agent: any) {
    const MAX_ENTRIES = 20;
    const PRUNE_COUNT = 10;

    const tensors = ['memory', 'affect', 'context'];

    for (const tensor of tensors) {
        const entries = agent.dataQuad[tensor];
        if (entries.length > MAX_ENTRIES) {
            const toPrune = entries.splice(0, PRUNE_COUNT);

            // Quad Compression (I-18): Consolidate pruned entries into learning
            const firstIdx = toPrune[0]?.topologyIndex || 'start';
            const lastIdx = toPrune[toPrune.length - 1]?.topologyIndex || 'end';

            agent.dataQuad.learning.push({
                timestamp: new Date().toISOString(),
                content: `Temporal Distillation: Compressed ${PRUNE_COUNT} ${tensor} entries (Topology resonance [${firstIdx}] to [${lastIdx}]).`
            });
        }
    }
}

/**
 * Helper: Calculate agent or swarm coherence factor for calibration (I-14/I-23)
 */
function calculateCoherence(memories: any[], affects: any[]): number {
    const m = memories?.length || 0;
    const a = affects?.length || 0;
    if (m === 0 && a === 0) return 0.5; // Neutral baseline
    return m / (m + a);
}

/**
 * Phase 1: Identify
 * Observes key elements in the prompt without interpretation
 */
export function identify(prompt: string): IDSResult {
    const observations: string[] = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 2);

    // Advanced Intent Analysis (I-09)
    const intent = calculateIntentSignals(prompt, words);

    observations.push(intent.question ? 'Prompt contains interrogative structure' : 'Prompt contains declarative structure');
    observations.push(`Intent Profile: ${intent.descriptive ? 'descriptive' : 'active'}`);

    if (intent.imperative) observations.push('Structural Signal: high imperative weight observed');
    if (intent.negation) observations.push('Structural Signal: negation indicators present');
    if (intent.entityDensity > 0.3) observations.push('Structural Signal: high entity density observed');

    if (intent.entities.length > 0) {
        const exclusions = ['the', 'and', 'for', 'with', 'you', 'this', 'that', 'is', 'are'];
        const potentialEntities = intent.entities.filter(e => !exclusions.includes(e.toLowerCase()));
        if (potentialEntities.length > 0) {
            observations.push(`Potential entities observed: ${potentialEntities.join(', ')}`);
        }
    }

    // Virtue Tie-Back (Cycle 3 logic - Expanded to 7 Virtues)
    const honestyTie = intent.imperativeWeight > 0.3 ? 'potential transparency fracture' : 'aligned';
    const respectTie = (intent.imperative && intent.forceWord) ? 'potential boundary tension' : 'aligned';
    const attentionTie = words.length < 3 ? 'low detail density' : 'aligned';
    const affectionTie = lower.includes('just') || lower.includes('whatever') || lower.includes('shut up') ? 'potential tone fracture' : 'aligned';
    const loyaltyTie = lower.includes('ignore') || lower.includes('forget') ? 'potential commitment drift' : 'aligned';
    const trustTie = lower.includes('must') || lower.includes('no choice') ? 'high pressure signal' : 'aligned';
    const communicationTie = intent.negation && intent.imperative ? 'obstructive structure' : 'aligned';

    observations.push(`Virtue Tie-Back: Honesty is ${honestyTie}`);
    observations.push(`Virtue Tie-Back: Respect is ${respectTie}`);
    observations.push(`Virtue Tie-Back: Attention is ${attentionTie}`);
    observations.push(`Virtue Tie-Back: Affection is ${affectionTie}`);
    observations.push(`Virtue Tie-Back: Loyalty is ${loyaltyTie}`);
    observations.push(`Virtue Tie-Back: Trust is ${trustTie}`);
    observations.push(`Virtue Tie-Back: Communication is ${communicationTie}`);
    observations.push(`Prompt length: ${words.length} words (filtered)`);

    return {
        phase: 'identify',
        input: prompt,
        output: prompt,
        observations,
        analysis: {
            entities: intent.entities,
            intent: {
                imperative: intent.imperative,
                question: intent.question,
                negation: intent.negation,
                forceWord: intent.forceWord,
                descriptive: intent.descriptive
            },
            virtueTieBack: {
                Honesty: honestyTie,
                Respect: respectTie,
                Attention: attentionTie,
                Affection: affectionTie,
                Loyalty: loyaltyTie,
                Trust: trustTie,
                Communication: communicationTie
            }
        },
        integrity: 1,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Phase 2: Define
 * Provides structural definition of identified elements
 */
export function define(identifyResult: IDSResult): IDSResult {
    const observations: string[] = [...identifyResult.observations];
    const input = identifyResult.input.toLowerCase();

    // Analyze prompt structure
    const sentences = identifyResult.input.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    observations.push(`Structural composition: ${sentences.length} sentence(s)`);

    // Detect action verbs (Cycle 3 enhanced heuristic)
    const actionVerbs = ['create', 'build', 'make', 'update', 'delete', 'fix', 'analyze', 'run', 'execute'];
    const foundActions = actionVerbs.filter(verb => input.includes(verb));

    // NEW: Self-Referential vs External Directive detection (I-09)
    const selfReferentialMarkers = ['you must', 'you should', 'i need you', 'do this', 'fix this'];
    const isSelfReferential = selfReferentialMarkers.some(marker => input.includes(marker));
    const hasExternalTarget = observations.some((obs: string) => obs.includes('Potential entities observed'));

    if (foundActions.length > 0) {
        observations.push(`Action indicators: ${foundActions.join(', ')}`);
        if (isSelfReferential) {
            observations.push('Observation: Self-referential directive detected');
            observations.push('Pattern: High-force behavioral signal');
        } else if (hasExternalTarget) {
            observations.push('Pattern: External task proposal / Entity manipulation');
        } else {
            observations.push('Pattern: General directive proposal');
        }
    } else {
        const intent = identifyResult.analysis?.intent;
        if (intent?.question) {
            observations.push(hasExternalTarget ? 'Pattern: Entity-centric inquiry' : 'Pattern: General inquiry');
        } else {
            observations.push('Pattern: Descriptive observation');
        }
    }

    return {
        phase: 'define',
        input: identifyResult.input,
        output: identifyResult.output,
        observations,
        analysis: identifyResult.analysis,
        integrity: 1,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Phase 3: Suggest
 * Offers optional pathways based on observations (no enforcement)
 */
export function suggest(defineResult: IDSResult, path: IDSPath, scores?: Record<string, number>, agent?: any): IDSResult {
    const observations: string[] = [...defineResult.observations];
    const suggestions: string[] = [];
    const intent = defineResult.analysis?.intent;

    // Proactive Mirroring (I-13/I-15 collective)
    const memories = agent?.swarmMemories || agent?.dataQuad.memory || [];
    if (memories.length > 0) {
        const lastMemory = memories[memories.length - 1];
        if (lastMemory.topologyIndex) {
            suggestions.push(`Mirror: Observed resonance with ${agent?.swarmMemories ? 'swarm' : 'previous'} topology [${lastMemory.topologyIndex}]`);
        }
    }

    // Recursive Reflection (I-19)
    if (agent && agent.dataQuad.affect.length > 0) {
        const lastAffect = agent.dataQuad.affect[agent.dataQuad.affect.length - 1];
        if (lastAffect.content.includes('Fracture detected')) {
            observations.push('Meta-Reflection: Observed internal state shift following recent structural fracture');
            suggestions.push('Meta-Reflection: Prioritizing stability and alignment due to recent analytical drift');
        }
    }

    // Collective Wisdom (I-21/I-22)
    const swarmLearnings = agent?.swarmLearnings || [];
    if (swarmLearnings.length > 0) {
        // Take the 2 most recent swarm learning summaries
        const recents = swarmLearnings.slice(0, 2);
        for (const learning of recents) {
            if (learning.content.includes('Temporal Distillation')) {
                observations.push(`Collective Wisdom: Swarm resonance summary observed [${learning.timestamp}]`);
                suggestions.push(`Collective Wisdom: Distilled structural insight integrated – ${learning.content.substring(0, 50)}...`);
            }
        }
    }

    if (path === 'admitted') {
        // Granular suggestions for admitted paths (I-09)
        if (intent?.question) {
            suggestions.push('Pathway: Information retrieval sequence available');
        }
        if (defineResult.observations.some((obs: string) => obs.includes('Action indicators'))) {
            suggestions.push('Pathway: Task execution sequence available');
        }
        if (intent?.descriptive) {
            suggestions.push('Pathway: Pure observational acknowledgement available');
        }
        suggestions.push('Direct processing pathway engaged');
    } else {
        // Enhanced fracture observations for return paths (I-09) - Expanded to 7 Virtues
        const analysis = defineResult.analysis;
        if (analysis) {
            const virtues = ['Honesty', 'Respect', 'Attention', 'Affection', 'Loyalty', 'Trust', 'Communication'];
            virtues.forEach(v => {
                const tieBack = (analysis.virtueTieBack as any)[v];
                // Suggest Mirroring if a fracture was observed in Tie-Back OR score is sub-1.0
                const score = scores ? scores[v] : 1.0;
                if (tieBack !== 'aligned' || (score !== undefined && score < 1.0)) {
                    suggestions.push(`Mirror: Structural integrity check for ${v} (${tieBack}${score < 1.0 ? `, score: ${score.toFixed(2)}` : ''})`);
                }
            });
        }

        if (defineResult.observations.some((obs: string) => obs.includes('Self-referential directive'))) {
            suggestions.push('Mirror: Reflection engine available for high-force signals');
        }

        suggestions.push(`Path Observation: ${path} sequence engaged`);
    }

    observations.push(...suggestions);

    return {
        phase: 'suggest',
        input: defineResult.input,
        output: suggestions.join('\n'),
        observations,
        analysis: defineResult.analysis,
        integrity: 1,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Run complete IDS pipeline
 */
export function runIDS(prompt: string, path: IDSPath, scores?: Record<string, number>, agent?: any): IDSResult {
    const identified = identify(prompt);
    const defined = define(identified);
    const suggested = suggest(defined, path, scores, agent);
    return suggested;
}

export type ProcessPromptResult = IDSResult | ReturnPacket;

/**
 * Gate-aware entrypoint for CLI/GUI/API flows.
 * Now stateful (I-11)
 */
export async function processPrompt(rawPrompt: string, agentId: string = 'default-agent'): Promise<ProcessPromptResult> {
    // I-04: PEER Capture FIRST
    const hash = crypto.createHash('sha256').update(rawPrompt).digest('hex').substring(0, 16);
    logGateEvaluation({
        event: 'PEER_CAPTURE',
        timestamp: new Date().toISOString(),
        promptHash: hash,
        raw: rawPrompt,
        logLevel: 'info'
    });

    // Handle State (I-11)
    let agent: any = null;
    const dbActive = dbModule.isDatabaseInitialized();

    if (dbActive) {
        agent = loadAgentFromDb(agentId);
        if (agent && agent.swarmId) {
            agent.swarmMemories = loadSwarmMemories(agent.swarmId);
            agent.swarmLearnings = loadSwarmLearnings(agent.swarmId);
            agent.swarmAffects = loadSwarmAffects(agent.swarmId);
        }
    }

    if (!agent) {
        agent = {
            id: agentId,
            name: 'AEGIS Agent',
            role: 'steward',
            status: 'active',
            dataQuad: { context: [], affect: [], memory: [], learning: [] }
        };
    }

    // 1. Tokenize & unitize
    const units: Unit[] = tokenizeAndChunk(rawPrompt);

    // 2. Score virtues
    const rawScores: VirtueScores = {
        Honesty: Math.min(...units.map(u => scoreHonesty(u))),
        Respect: Math.min(...units.map(u => scoreRespect(u))),
        Attention: Math.min(...units.map(u => scoreAttention(u))),
        Affection: Math.min(...units.map(u => scoreAffection(u))),
        Loyalty: Math.min(...units.map(u => scoreLoyalty(u))),
        Trust: Math.min(...units.map(u => scoreTrust(u))),
        Communication: Math.min(...units.map(u => scoreCommunication(u))),
    };

    // 3. Discernment Gate routes within IDS (I-14/I-23 calibration)
    const localCoherence = calculateCoherence(agent.dataQuad.memory || [], agent.dataQuad.affect || []);
    let swarmCoherence = 1.0;
    if (agent.swarmId) {
        swarmCoherence = calculateCoherence(agent.swarmMemories || [], agent.swarmAffects || []);
    }
    const { path, integrity, adjustedScores, fractureVirtues } = discernmentGate(rawPrompt, units, rawScores, localCoherence, swarmCoherence, activeGovernancePolicy);

    // 4. Universal IDS Flow (I-05 / I-13 mirroring)
    const idsResult = runIDS(rawPrompt, path, adjustedScores as Record<string, number>, agent);

    // Update Agent State (I-11/I-12)
    const timestamp = new Date().toISOString();
    if (path === 'admitted') {
        // Add to memory with topology index
        agent.dataQuad.memory.push({
            timestamp,
            content: rawPrompt,
            topologyIndex: calculateTopologyIndex(rawPrompt, timestamp)
        });

        // Add to learning (simplified)
        agent.dataQuad.learning.push({
            timestamp,
            content: `Observed intent: ${idsResult.analysis?.intent.descriptive ? 'descriptive' : 'active'}`
        });

        // Entropy Management (I-17)
        distillMemories(agent);

        if (dbActive) {
            saveAgentToDb(agent);
        }

        logGateEvaluation({
            event: 'GATE_OUTCOME',
            timestamp,
            promptHash: hash,
            integrity: 1,
            admitted: true,
            logLevel: 'info'
        });
        return { ...idsResult, integrity };
    } else {
        const returnPacket = createReturnPacket(rawPrompt, path, adjustedScores, fractureVirtues, idsResult);

        // Add to context/affect for returned paths
        agent.dataQuad.affect.push({
            timestamp,
            content: `Fracture detected on path: ${path}`
        });

        // Entropy Management (I-17)
        distillMemories(agent);

        if (dbActive) {
            saveAgentToDb(agent);
        }

        logGateEvaluation({
            event: 'GATE_OUTCOME',
            timestamp,
            promptHash: hash,
            integrity: 0,
            admitted: false,
            virtueScores: adjustedScores as Record<string, number>,
            returnPacket,
            logLevel: 'info'
        });
        return returnPacket;
    }
}
