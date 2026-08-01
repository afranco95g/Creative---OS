import type {
  ReviewDefinition,
} from './review-definition';

export type ReviewSessionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export interface ReviewSession {
  id: string;

  review: ReviewDefinition;

  status: ReviewSessionStatus;

  createdAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  context: Record<string, unknown>;
}