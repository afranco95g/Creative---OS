export interface ReviewDimensionDefinition {
  id: string;

  name: string;

  description?: string;
}

export interface ReviewDefinition {
  id: string;

  name: string;

  description?: string;

  dimensions: ReviewDimensionDefinition[];
}