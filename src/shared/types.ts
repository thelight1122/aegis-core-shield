// src/shared/types.ts (core contract – browser safe)

export type AgentEvent =
  | ToolCallEvent
  | ModelResponseEvent
  | HeartbeatEvent
  | AegisErrorEvent
  | CostRelevantEvent
  | PauseTriggerEvent;

export interface BaseEvent {
  timestamp: string;              // ISO 8601
  agentId: string;                // unique per agent instance (e.g., "email-assistant-001")
  eventType: string;
  rawLogLine?: string;            // original for debugging / manual review
}

export interface ToolCallEvent extends BaseEvent {
  eventType: "tool_call";
  toolName: string;               // e.g., "send_email", "browse_page", "execute_shell"
  parameters: Record<string, any>;
  isVerifiedSkill: boolean;       // from ClawHub safe-list check (future extension)
  estimatedTokenCost?: number;    // rough calc if available
}

export interface ModelResponseEvent extends BaseEvent {
  eventType: "model_response";
  content: string;                // full or truncated response
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  model: string;                  // e.g., "claude-3.5-sonnet", "gemini-flash"
}

export interface HeartbeatEvent extends BaseEvent {
  eventType: "heartbeat";
  intervalSeconds: number;        // time since last heartbeat
  idleDuration?: number;          // how long agent has been waiting
  contextSize?: number;           // current context tokens (leak indicator)
}

export interface AegisErrorEvent extends BaseEvent {
  eventType: "error";
  message: string;
  stack?: string;
  severity: "warning" | "error" | "fatal";
}

export interface CostRelevantEvent extends BaseEvent {
  eventType: "cost_relevant";
  category: "high_token_input" | "repetitive_call" | "idle_loop" | "context_bloat" | "other";
  estimatedExtraCost: number;     // rough $ or tokens
  description: string;            // human-readable
}

export interface PauseTriggerEvent extends BaseEvent {
  eventType: "pause_trigger";
  reason: string;                 // from Interceptor
  severity: "low" | "medium" | "high";
  suggestedAction?: "review" | "discard" | "continue";
}

// AEGIS Core Types (Commonly Shared)

export interface ReflectionStage {
    stage: 'Identify' | 'Define' | 'Question' | 'Reflect' | 'Acknowledge';
    content: string;
}

export interface ReflectionSequence {
    type: 'IDR' | 'IDQRA';
    stages: ReflectionStage[];
    timestamp: string;
}

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
            Respect: string;
            Attention: string;
            Affection: string;
            Loyalty: string;
            Trust: string;
            Communication: string;
        };
    };
    integrity: number;
    timestamp: string;
}

export interface VirtueScores {
  Honesty: number;
  Respect: number;
  Attention: number;
  Affection: number;
  Loyalty: number;
  Trust: number;
  Communication: number;
  [key: string]: number;
}

export interface ReturnPacket {
  source: 'IDS';
  status: 'discernment_gate_return';
  path: 'shallow-return' | 'deep-return' | 'quarantine';
  depth: 'shallow' | 'deep' | 'quarantine';
  integrity: 0;
  message: string;
  observed_alignment: Record<string, { score: number; passed_tolerance: boolean; min_unit?: string }>;
  fracture_locations: Array<{ unit: string; virtues_affected: string[]; observation: string }>;
  realignment_observations: string[];
  original_prompt: string;
  action_taken: 'none – prompt not processed further';
  reflection_sequence?: ReflectionSequence;
  ids_observations: IDSResult;
}

export interface GovernancePolicy {
  version: number;
  globalThresholdMultiplier: number;
  blacklistedPatterns: string[];
}

export type IDSPath = 'admitted' | 'shallow-return' | 'deep-return' | 'quarantine';