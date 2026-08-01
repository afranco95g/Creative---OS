import type {
  ReviewSession,
} from './review-session';

import type {
  ReviewDimensionResult,
} from './review-dimension-result';

export interface ReviewExecution {
  session: ReviewSession;

  currentDimensionId?: string;

  progress: number;

  logs: string[];

  dimensionResults: ReviewDimensionResult[];

  startedAt: Date;
}