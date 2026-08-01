import { ProjectGraph, ConversationMessage } from '../types/project';
import { ExecutiveInsight, analyzeProject } from './executiveBrain';
import { ProductionUpdate, buildProductionUpdate } from './productionEngine';
import { ExperienceStep, buildExperienceSteps } from './experienceEngine';

export interface PipelineResult {
  graph: ProjectGraph;
  executiveInsight: ExecutiveInsight;
  productionUpdate: ProductionUpdate;
  experienceSteps: ExperienceStep[];
  messages: ConversationMessage[];
}

export function runProductionPipeline(
  graph: ProjectGraph,
  messages: ConversationMessage[]
): PipelineResult {
  const executiveInsight = analyzeProject(graph, messages);
  const productionUpdate = buildProductionUpdate(graph);
  const experienceSteps = buildExperienceSteps(graph.title);

  return {
    graph,
    executiveInsight,
    productionUpdate,
    experienceSteps,
    messages,
  };
}