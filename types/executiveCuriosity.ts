export type ExecutiveCuriosityType =
  | 'strategic'
  | 'operational'
  | 'economic'
  | 'human'
  | 'relational'
  | 'risk'
  | 'validation'
  | 'contradiction';

export type ExecutiveCuriosityStatus =
  | 'latent'
  | 'active'
  | 'urgent'
  | 'partially-resolved'
  | 'resolved'
  | 'suspended'
  | 'invalidated';

export type ExecutiveInterventionType =
  | 'ask'
  | 'deepen'
  | 'confirm'
  | 'summarize'
  | 'connect'
  | 'contrast'
  | 'propose'
  | 'remember'
  | 'wait';

export interface ExecutiveCuriosityEvidence {
  sourceType:
    | 'project-graph'
    | 'conversation'
    | 'executive-memory'
    | 'executive-narrative'
    | 'session-handoff'
    | 'document'
    | 'task'
    | 'risk'
    | 'decision'
    | 'manual'
    | 'other';

  referenceId?: string;

  label?: string;

  excerpt?: string;

  confidence?: number;
}

export interface ExecutiveCuriosityScore {
  impact: number;
  urgency: number;
  uncertaintyReduction: number;
  unblockPotential: number;
  cognitiveCost: number;
  interruptionRisk: number;
  total: number;
}

export interface ExecutiveCuriosityItem {
  id: string;

  projectId: string;

  type: ExecutiveCuriosityType;

  topic: string;

  reason: string;

  status: ExecutiveCuriosityStatus;

  priority: number;

  confidence: number;

  score: ExecutiveCuriosityScore;

  evidence: ExecutiveCuriosityEvidence[];

  possibleInterventions: ExecutiveInterventionType[];

  currentIntervention?: ExecutiveInterventionType;

  suggestedPrompt?: string;

  lastAskedAt?: string;

  askedCount: number;

  createdAt: string;

  updatedAt: string;

  resolvedAt?: string;

  suspendedUntil?: string;

  invalidatedReason?: string;
}

export interface ExecutiveConversationUnderstanding {
  understoodTopics: string[];

  partiallyUnderstoodTopics: string[];

  unresolvedTopics: string[];

  activeHypotheses: string[];

  currentFocus?: string;

  lastIntervention?: ExecutiveIntervention;

  nextBestIntervention?: ExecutiveIntervention;
}

export interface ExecutiveIntervention {
  id: string;

  projectId: string;

  type: ExecutiveInterventionType;

  objective: string;

  message?: string;

  curiosityId?: string;

  rationale: string;

  confidence: number;

  createdAt: string;

  deliveredAt?: string;

  outcome?:
    | 'helpful'
    | 'ignored'
    | 'answered'
    | 'redirected'
    | 'not-delivered'
    | 'unknown';
}

export interface ExecutiveConversationState {
  projectId: string;

  understanding: ExecutiveConversationUnderstanding;

  curiosities: ExecutiveCuriosityItem[];

  activeCuriosityIds: string[];

  urgentCuriosityIds: string[];

  resolvedCuriosityIds: string[];

  suspendedCuriosityIds: string[];

  lastUserMessageAt?: string;

  lastSystemMessageAt?: string;

  sessionStartedAt?: string;

  sessionEndedAt?: string;

  updatedAt: string;
}

export interface CreateExecutiveCuriosityInput {
  projectId: string;

  type: ExecutiveCuriosityType;

  topic: string;

  reason: string;

  status?: ExecutiveCuriosityStatus;

  priority?: number;

  confidence?: number;

  evidence?: ExecutiveCuriosityEvidence[];

  possibleInterventions?: ExecutiveInterventionType[];

  suggestedPrompt?: string;
}

export interface UpdateExecutiveCuriosityInput {
  type?: ExecutiveCuriosityType;

  topic?: string;

  reason?: string;

  status?: ExecutiveCuriosityStatus;

  priority?: number;

  confidence?: number;

  score?: ExecutiveCuriosityScore;

  evidence?: ExecutiveCuriosityEvidence[];

  possibleInterventions?: ExecutiveInterventionType[];

  currentIntervention?: ExecutiveInterventionType;

  suggestedPrompt?: string;

  lastAskedAt?: string;

  askedCount?: number;

  resolvedAt?: string;

  suspendedUntil?: string;

  invalidatedReason?: string;
}

export interface ExecutiveCuriositySnapshot {
  projectId: string | null;

  curiosities: ExecutiveCuriosityItem[];

  activeCuriosities: ExecutiveCuriosityItem[];

  urgentCuriosities: ExecutiveCuriosityItem[];

  resolvedCuriosities: ExecutiveCuriosityItem[];

  suspendedCuriosities: ExecutiveCuriosityItem[];

  nextBestIntervention: ExecutiveIntervention | null;

  lastUpdatedAt: string | null;
}