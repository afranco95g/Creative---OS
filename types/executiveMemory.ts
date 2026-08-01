export type ExecutiveMemoryType =
  | 'decision'
  | 'hypothesis'
  | 'constraint'
  | 'criterion'
  | 'risk'
  | 'opportunity'
  | 'commitment'
  | 'contradiction'
  | 'direction-change'
  | 'learning'
  | 'priority'
  | 'open-question';

export type ExecutiveMemoryStatus =
  | 'proposed'
  | 'confirmed'
  | 'active'
  | 'superseded'
  | 'contradicted'
  | 'archived'
  | 'rejected';

export type ExecutiveMemoryScope =
  | 'project'
  | 'workspace'
  | 'organization'
  | 'ecosystem';

export type ExecutiveMemorySourceType =
  | 'conversation'
  | 'document'
  | 'project-graph'
  | 'task'
  | 'decision'
  | 'risk'
  | 'session-handoff'
  | 'manual'
  | 'system'
  | 'other';

export interface ExecutiveMemorySource {
  type: ExecutiveMemorySourceType;
  referenceId?: string;
  label?: string;
  excerpt?: string;
}

export interface ExecutiveMemoryValidation {
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  validationNote?: string;
}

export interface ExecutiveMemoryRelation {
  memoryId: string;
  relationship:
    | 'supports'
    | 'contradicts'
    | 'replaces'
    | 'depends-on'
    | 'derived-from'
    | 'related-to';
}

export interface ExecutiveMemoryItem {
  id: string;

  projectId?: string;
  workspaceId?: string;
  organizationId?: string;

  scope: ExecutiveMemoryScope;

  type: ExecutiveMemoryType;

  status: ExecutiveMemoryStatus;

  summary: string;

  detail?: string;

  reason?: string;

  implications?: string[];

  confidence: number;

  source: ExecutiveMemorySource;

  validation: ExecutiveMemoryValidation;

  tags: string[];

  relations: ExecutiveMemoryRelation[];

  createdAt: string;

  updatedAt: string;

  effectiveFrom?: string;

  expiresAt?: string;

  supersededByMemoryId?: string;

  isSensitive: boolean;
}

export interface ExecutiveMemorySnapshot {
  memories: ExecutiveMemoryItem[];

  activeMemories: ExecutiveMemoryItem[];

  proposedMemories: ExecutiveMemoryItem[];

  contradictedMemories: ExecutiveMemoryItem[];

  archivedMemories: ExecutiveMemoryItem[];

  lastUpdatedAt: string | null;
}

export interface CreateExecutiveMemoryInput {
  projectId?: string;
  workspaceId?: string;
  organizationId?: string;

  scope?: ExecutiveMemoryScope;

  type: ExecutiveMemoryType;

  summary: string;

  detail?: string;

  reason?: string;

  implications?: string[];

  confidence?: number;

  source: ExecutiveMemorySource;

  tags?: string[];

  relatedMemories?: ExecutiveMemoryRelation[];

  isSensitive?: boolean;
}

export interface UpdateExecutiveMemoryInput {
  type?: ExecutiveMemoryType;

  status?: ExecutiveMemoryStatus;

  summary?: string;

  detail?: string;

  reason?: string;

  implications?: string[];

  confidence?: number;

  source?: ExecutiveMemorySource;

  validation?: ExecutiveMemoryValidation;

  tags?: string[];

  relations?: ExecutiveMemoryRelation[];

  effectiveFrom?: string;

  expiresAt?: string;

  supersededByMemoryId?: string;

  isSensitive?: boolean;
}

export interface ExecutiveMemoryConflict {
  id: string;

  projectId?: string;

  memoryIds: string[];

  summary: string;

  explanation: string;

  severity:
    | 'low'
    | 'medium'
    | 'high'
    | 'critical';

  status:
    | 'open'
    | 'resolved'
    | 'dismissed';

  detectedAt: string;

  resolvedAt?: string;

  resolutionNote?: string;
}

export interface ExecutiveMemoryQuery {
  projectId?: string;

  scope?: ExecutiveMemoryScope;

  types?: ExecutiveMemoryType[];

  statuses?: ExecutiveMemoryStatus[];

  tags?: string[];

  includeSensitive?: boolean;

  search?: string;
}