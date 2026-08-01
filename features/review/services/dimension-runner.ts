import type {
  ReviewDimensionDefinition,
} from '../types/review-definition';

import type {
  ReviewDimensionResult,
} from '../types/review-dimension-result';

export class DimensionRunner {

  public run(
    dimension: ReviewDimensionDefinition,
  ): ReviewDimensionResult {

    return {

      dimensionId: dimension.id,

      status: 'completed',

      findings: [],

      recommendations: [],

    };

  }

}