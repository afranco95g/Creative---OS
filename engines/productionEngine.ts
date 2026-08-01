import { ProjectGraph, ProjectModule } from '../types/project';
import { getAllDocumentReadiness } from './documentEngine';

export interface ProductionUpdate {
  producerThought: string;
  updatedModules: ProjectModule[];
  documentsAdvanced: {
    title: string;
    readiness: number;
  }[];
  createdTasks: string[];
  recentEvents: {
    title: string;
    description: string;
  }[];
}

export function buildProductionUpdate(graph: ProjectGraph): ProductionUpdate {
  const updatedModules = Object.values(graph.modules)
    .filter((module) => module.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const documentsAdvanced = getAllDocumentReadiness(graph)
    .filter((document) => document.readiness > 0)
    .map((document) => ({
      title: document.definition.title,
      readiness: document.readiness,
    }))
    .slice(0, 4);

  const createdTasks = graph.tasks
    .slice(0, 4)
    .map((task) => task.title);

  const recentEvents = graph.eventLog
    .slice(0, 4)
    .map((event) => ({
      title: event.title,
      description: event.description,
    }));

  return {
    producerThought: buildProducerThought(graph, updatedModules),
    updatedModules,
    documentsAdvanced,
    createdTasks,
    recentEvents,
  };
}

function buildProducerThought(
  graph: ProjectGraph,
  updatedModules: ProjectModule[]
): string {
  if (updatedModules.length === 0) {
    return 'Estoy listo para empezar a organizar la idea y convertirla en un proyecto.';
  }

  const strongest = updatedModules[0];

  return `Estoy organizando ${strongest.title.toLowerCase()} y usando esa información para actualizar documentos, tareas y diagnóstico.`;
}