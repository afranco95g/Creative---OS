import {
  ConversationMessage,
  ProjectGraph,
} from './project';
import { WorkspaceProject } from './workspace';

export type ContextExportFormat =
  | 'json'
  | 'markdown';

export type ContextExportDepth =
  | 'brief'
  | 'executive'
  | 'complete'
  | 'technical';

export type ContextDestination =
  | 'external-ai'
  | 'human'
  | 'team'
  | 'api'
  | 'workspace'
  | 'review'
  | 'other';

export interface ContextPackageMetadata {
  id: string;
  generatedAt: string;
  formatVersion: string;
  source: 'creative-os';
  exportDepth: ContextExportDepth;
}

export interface ContextProjectSummary {
  id: string;
  title: string;
  description: string;
  category: WorkspaceProject['category'];
  createdAt: string;
  updatedAt: string;
  stage: string;
  progress: number;
}

export interface ContextExecutiveState {
  summary: string;

  maturityLevel:
    | 'exploratory'
    | 'emerging'
    | 'structured'
    | 'activation-ready';

  maturityLabel: string;

  strengths: string[];

  uncertainties: string[];

  currentPriority: string;

  risks: string[];

  opportunities: string[];

  executiveRecommendation: string;

  nextSprint: string;

  openQuestions: string[];

  nextSteps: string[];
}

export interface SessionIntent {
  objective: string;
  primaryQuestion: string;
  expectedOutput: string;
  destination: ContextDestination;
  constraints: string[];
  successCriteria: string[];
}

export interface SessionChange {
  id: string;
  type:
    | 'module'
    | 'task'
    | 'document'
    | 'decision'
    | 'risk'
    | 'ally'
    | 'timeline'
    | 'priority'
    | 'direction'
    | 'other';
  summary: string;
  occurredAt: string;
}

export interface SessionDecision {
  id: string;
  summary: string;
  reason?: string;
  alternatives?: string[];
  validatedBy?: string;
  decidedAt?: string;
  isConfirmed: boolean;
}

export interface SessionHandoff {
  sessionId: string;
  generatedAt: string;

  intent: SessionIntent;

  changes: SessionChange[];

  decisions: SessionDecision[];

  hypotheses: string[];

  openQuestions: string[];

  blockers: string[];

  risks: string[];

  nextPriority: string;

  nextSprint: string;

  continuationInstructions: string[];
}

export interface CreativeContextPackage {
  metadata: ContextPackageMetadata;

  project: ContextProjectSummary;

  graph: ProjectGraph;

  conversation: {
    messages: ConversationMessage[];
    totalMessages: number;
  };

  executiveState: ContextExecutiveState;

  handoff?: SessionHandoff;
}

export interface ContextExportOptions {
  format: ContextExportFormat;
  depth: ContextExportDepth;
  includeConversation: boolean;
  includeGraph: boolean;
  includeHandoff: boolean;
  excludePersonalData: boolean;
}