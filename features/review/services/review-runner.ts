import { DimensionRunner } from './dimension-runner';

import type {
  ReviewDimensionDefinition,
} from '../types/review-definition';

import type {
  ReviewDimensionResult,
} from '../types/review-dimension-result';

import type {
  ReviewExecution,
} from '../types/review-execution';

import type {
  ReviewSession,
} from '../types/review-session';

export interface ReviewRunnerResult {
  sessionId: string;

  reviewId: string;

  status: 'completed';

  progress: number;

  logs: string[];

  dimensionResults: ReviewDimensionResult[];

  startedAt: Date;

  completedAt: Date;
}

export class ReviewRunner {
  private readonly dimensionRunner:
    DimensionRunner;

  public constructor(
    dimensionRunner: DimensionRunner =
      new DimensionRunner()
  ) {
    this.dimensionRunner =
      dimensionRunner;
  }

  public run(
    session: ReviewSession
  ): ReviewRunnerResult {
    this.validateSession(session);

    const execution =
      this.createExecution(session);

    session.status = 'running';
    session.startedAt =
      execution.startedAt;

    execution.logs.push(
      `Review "${session.review.id}" iniciado.`
    );

    this.executeDimensions(execution);

    execution.progress = 100;
    execution.currentDimensionId =
      undefined;

    const completedAt =
      new Date();

    session.status = 'completed';
    session.completedAt =
      completedAt;

    execution.logs.push(
      `Review "${session.review.id}" completado.`
    );

    return {
      sessionId: session.id,

      reviewId: session.review.id,

      status: 'completed',

      progress: execution.progress,

      logs: execution.logs,

      dimensionResults:
        execution.dimensionResults,

      startedAt: execution.startedAt,

      completedAt,
    };
  }

  private validateSession(
    session: ReviewSession
  ): void {
    if (session.status === 'running') {
      throw new Error(
        `La sesión "${session.id}" ya está en ejecución.`
      );
    }

    if (session.status === 'completed') {
      throw new Error(
        `La sesión "${session.id}" ya fue completada.`
      );
    }
  }

  private createExecution(
    session: ReviewSession
  ): ReviewExecution {
    return {
      session,

      progress: 0,

      logs: [],

      dimensionResults: [],

      startedAt: new Date(),
    };
  }

  private executeDimensions(
    execution: ReviewExecution
  ): void {
    const dimensions =
      execution.session.review.dimensions;

    for (const dimension of dimensions) {
      this.executeDimension(
        execution,
        dimension
      );
    }
  }

  private executeDimension(
    execution: ReviewExecution,
    dimension: ReviewDimensionDefinition
  ): void {
    execution.currentDimensionId =
      dimension.id;

    execution.logs.push(
      `Dimensión "${dimension.name}" iniciada.`
    );

    const result =
      this.dimensionRunner.run(
        dimension
      );

    execution.dimensionResults.push(
      result
    );

    execution.logs.push(
      `Dimensión "${dimension.name}" completada.`
    );

    this.updateProgress(execution);
  }

  private updateProgress(
    execution: ReviewExecution
  ): void {
    const completedDimensions =
      execution.dimensionResults.filter(
        result =>
          result.status === 'completed'
      ).length;

    const totalDimensions =
      execution.session.review.dimensions.length;

    execution.progress =
      totalDimensions === 0
        ? 100
        : Math.round(
            (
              completedDimensions /
              totalDimensions
            ) * 100
          );
  }
}