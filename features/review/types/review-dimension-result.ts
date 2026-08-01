export type ReviewDimensionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export interface ReviewDimensionResult {
  dimensionId: string;

  status: ReviewDimensionStatus;

  score?: number;

  findings: string[];

  recommendations: string[];
}