// src/shared/types.ts (core contract – locked for v0.1)

type AgentEvent =
  | ToolCallEvent
  | ModelResponseEvent
  | HeartbeatEvent
  | AegisErrorEvent
  | CostRelevantEvent
  | PauseTriggerEvent;

interface BaseEvent {
  timestamp: string;              // ISO 8601
  agentId: string;                // unique per agent instance (e.g., "email-assistant-001")
  eventType: string;
  rawLogLine?: string;            // original for debugging / manual review
}

interface ToolCallEvent extends BaseEvent {
  eventType: "tool_call";
  toolName: string;               // e.g., "send_email", "browse_page", "execute_shell"
  parameters: Record<string, any>;
  isVerifiedSkill: boolean;       // from ClawHub safe-list check (future extension)
  estimatedTokenCost?: number;    // rough calc if available
}

interface ModelResponseEvent extends BaseEvent {
  eventType: "model_response";
  content: string;                // full or truncated response
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  model: string;                  // e.g., "claude-3.5-sonnet", "gemini-flash"
}

interface HeartbeatEvent extends BaseEvent {
  eventType: "heartbeat";
  intervalSeconds: number;        // time since last heartbeat
  idleDuration?: number;          // how long agent has been waiting
  contextSize?: number;           // current context tokens (leak indicator)
}

interface AegisErrorEvent extends BaseEvent {
  eventType: "error";
  message: string;
  stack?: string;
  severity: "warning" | "error" | "fatal";
}

interface CostRelevantEvent extends BaseEvent {
  eventType: "cost_relevant";
  category: "high_token_input" | "repetitive_call" | "idle_loop" | "context_bloat" | "other";
  estimatedExtraCost: number;     // rough $ or tokens
  description: string;            // human-readable
}

interface PauseTriggerEvent extends BaseEvent {
  eventType: "pause_trigger";
  reason: string;                 // from Interceptor
  severity: "low" | "medium" | "high";
  suggestedAction?: "review" | "discard" | "continue";
}