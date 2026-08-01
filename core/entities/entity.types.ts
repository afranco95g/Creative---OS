export type EntityId = string;
export type EntityVersionId = string;
export type UserId = string;

export type EntityStatus =
  | 'draft'
  | 'in_review'
  | 'published'
  | 'archived';

export type EntityVersionStatus =
  | 'draft'
  | 'in_review'
  | 'published'
  | 'superseded';

export type CapabilityId = string;

export interface CapabilityDefinition {
  id: CapabilityId;
  label: string;
  description: string;
  required?: boolean;
  weight?: number;
  minimumCompletion?: number;
}

export interface EntityDefinition {
  type: string;
  label: string;
  description: string;
  capabilities: CapabilityDefinition[];
  minimumCompletion?: number;
}

export interface CapabilityState {
  capabilityId: CapabilityId;
  status: 'empty' | 'in_progress' | 'complete' | 'needs_changes';
  completion: number;
  data: Record<string, unknown>;
  validationErrors: string[];
  updatedAt: string;
}

export interface EntityVersion {
  id: EntityVersionId;
  entityId: EntityId;
  number: number;
  status: EntityVersionStatus;
  name: string;
  slug: string;
  headline?: string;
  description?: string;
  capabilities: Record<CapabilityId, CapabilityState>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Entity {
  id: EntityId;
  type: string;
  status: EntityStatus;
  ownerUserId: UserId;
  currentDraftVersionId: EntityVersionId | null;
  publishedVersionId: EntityVersionId | null;
  createdAt: string;
  updatedAt: string;
}

export type EntityMemberRole =
  | 'owner'
  | 'manager'
  | 'editor'
  | 'viewer';

export interface EntityMember {
  entityId: EntityId;
  userId: UserId;
  role: EntityMemberRole;
  createdAt: string;
}

export interface DomainEvent<TPayload = Record<string, unknown>> {
  id: string;
  name: string;
  aggregateId: string;
  actorUserId: UserId;
  payload: TPayload;
  occurredAt: string;
}

export interface CreateEntityInput {
  type: string;
  ownerUserId: UserId;
  name: string;
  slug?: string;
}

export interface CreateEntityResult {
  entity: Entity;
  version: EntityVersion;
  member: EntityMember;
  events: DomainEvent[];
}

export interface UpdateCapabilityInput {
  entityId: EntityId;
  userId: UserId;
  capabilityId: CapabilityId;
  data: Record<string, unknown>;
  completion: number;
  validationErrors?: string[];
}

export interface EntityValidationResult {
  valid: boolean;
  completion: number;
  errors: string[];
}
