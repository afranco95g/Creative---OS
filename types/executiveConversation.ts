import {
  ExecutiveConversationState,
  ExecutiveCuriosityItem,
  ExecutiveInterventionType,
} from './executiveCuriosity';
import {
  ExecutiveMemoryItem,
} from './executiveMemory';
import {
  ConversationMessage,
  ProjectGraph,
} from './project';

export type ExecutiveConversationMode =
  | 'first-session'
  | 'resume-session'
  | 'active-conversation'
  | 'reflection'
  | 'decision'
  | 'closing';

export type ExecutiveConversationAction =
  | ExecutiveInterventionType
  | 'listen'
  | 'reflect'
  | 'challenge'
  | 'celebrate'
  | 'resume'
  | 'close';

export type ExecutiveConversationDeliveryStatus =
  | 'pending'
  | 'delivered'
  | 'suppressed'
  | 'ignored'
  | 'answered'
  | 'redirected'
  | 'partially-resolved'
  | 'failed';

export type ExecutiveConversationReason =
  | 'first-session'
  | 'session-resume'
  | 'critical-risk'
  | 'contradiction'
  | 'user-elaboration'
  | 'confirmation-needed'
  | 'decision-needed'
  | 'active-curiosity'
  | 'connection-opportunity'
  | 'proposal-ready'
  | 'summary-needed'
  | 'low-value'
  | 'high-interruption-risk'
  | 'repetition-risk'
  | 'manual';

export interface ExecutiveConversationSignal {
  id: string;

  type:
    | 'long-message'
    | 'short-message'
    | 'topic-change'
    | 'repetition'
    | 'question'
    | 'decision-language'
    | 'uncertainty-language'
    | 'closing-language'
    | 'exploration-language'
    | 'frustration-signal'
    | 'enthusiasm-signal'
    | 'other';

  description: string;

  confidence: number;

  sourceMessageId?: string;
}

export interface ExecutiveConversationContext {
  projectId: string;

  graph: ProjectGraph;

  messages: ConversationMessage[];

  memories: ExecutiveMemoryItem[];

  curiosities: ExecutiveCuriosityItem[];

  conversationState: ExecutiveConversationState;

  mode: ExecutiveConversationMode;

  currentUserMessage?: ConversationMessage;

  recentUserMessages: ConversationMessage[];

  recentAssistantMessages: ConversationMessage[];

  signals: ExecutiveConversationSignal[];
}

export interface ExecutiveConversationDecision {
  shouldDeliver: boolean;

  action: ExecutiveConversationAction;

  reason: ExecutiveConversationReason;

  objective: string;

  rationale: string;

  confidence: number;

  cognitiveCost: number;

  interruptionRisk: number;

  repetitionRisk: number;

  relatedCuriosityId?: string;

  relatedMemoryIds: string[];
}

export interface ExecutiveConversationMessageDraft {
  id: string;

  projectId: string;

  action: ExecutiveConversationAction;

  objective: string;

  message: string;

  rationale: string;

  confidence: number;

  relatedCuriosityId?: string;

  relatedMemoryIds: string[];

  createdAt: string;
}

export interface ExecutiveConversationIntervention {
  id: string;

  projectId: string;

  mode: ExecutiveConversationMode;

  action: ExecutiveConversationAction;

  reason: ExecutiveConversationReason;

  objective: string;

  message?: string;

  rationale: string;

  confidence: number;

  shouldDeliver: boolean;

  deliveryStatus: ExecutiveConversationDeliveryStatus;

  relatedCuriosityId?: string;

  relatedMemoryIds: string[];

  createdAt: string;

  deliveredAt?: string;

  resolvedAt?: string;

  outcomeNote?: string;
}

export interface ExecutiveConversationResult {
  context: ExecutiveConversationContext;

  decision: ExecutiveConversationDecision;

  intervention:
    ExecutiveConversationIntervention | null;

  messageDraft:
    ExecutiveConversationMessageDraft | null;

  shouldUpdateConversationState: boolean;

  shouldUpdateCuriosity: boolean;

  shouldCreateMemoryCandidate: boolean;
}

export interface BuildExecutiveConversationInput {
  projectId: string;

  graph: ProjectGraph;

  messages: ConversationMessage[];

  memories: ExecutiveMemoryItem[];

  curiosities: ExecutiveCuriosityItem[];

  conversationState: ExecutiveConversationState;

  mode?: ExecutiveConversationMode;

  currentUserMessage?: ConversationMessage;
}

export interface ExecutiveConversationPolicy {
  minimumDeliveryConfidence: number;

  maximumCognitiveCost: number;

  maximumInterruptionRisk: number;

  maximumRepetitionRisk: number;

  maximumQuestionsPerIntervention: number;

  recentMessageWindow: number;

  allowSilence: boolean;

  allowTopicChange: boolean;

  requireHumanValidationForDecisions: boolean;
}

export interface ExecutiveConversationSnapshot {
  projectId: string | null;

  mode: ExecutiveConversationMode | null;

  currentIntervention:
    ExecutiveConversationIntervention | null;

  lastDeliveredIntervention:
    ExecutiveConversationIntervention | null;

  pendingInterventions:
    ExecutiveConversationIntervention[];

  interventionHistory:
    ExecutiveConversationIntervention[];

  lastUpdatedAt: string | null;
}