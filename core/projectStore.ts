import type {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

import {
  createInitialProjectGraph,
  getProjectProgress,
} from './projectEngine';

import {
  createProjectControllerState,
  processProjectMessage,
} from './projectController';

import type {
  ProjectControllerState,
} from './projectController';

export interface ProjectStoreSnapshot {
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
  state: ProjectControllerState;
}

type ProjectStoreListener = (
  snapshot: ProjectStoreSnapshot
) => void;

class ProjectStore {
  private state: ProjectControllerState;

  private snapshot: ProjectStoreSnapshot;

  private listeners: ProjectStoreListener[] = [];

  constructor() {
    const graph = createInitialProjectGraph();

    this.state =
      createProjectControllerState(graph);

    this.snapshot = this.createSnapshot();
  }

  getSnapshot(): ProjectStoreSnapshot {
    return this.snapshot;
  }

  subscribe(listener: ProjectStoreListener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(
        (current) => current !== listener
      );
    };
  }

  sendMessage(userInput: string) {
    const cleanInput = userInput.trim();

    if (!cleanInput) {
      return;
    }

    const result = processProjectMessage(
      this.state,
      cleanInput
    );

    this.state = result.state;

    this.emit();
  }

  startProject(
    title: string,
    initialDescription: string
  ) {
    const initialGraph =
      createInitialProjectGraph();

    const graph: ProjectGraph = {
      ...initialGraph,
      title,
    };

    this.state =
      createProjectControllerState(graph);

    const cleanDescription =
      initialDescription.trim();

    if (cleanDescription) {
      const result = processProjectMessage(
        this.state,
        cleanDescription
      );

      this.state = result.state;
    }

    this.emit();
  }

  loadProject(
    graph: ProjectGraph,
    messages: ConversationMessage[] = []
  ) {
    const baseState =
      createProjectControllerState(graph);

    this.state = {
      ...baseState,
      messages,
    };

    this.emit();
  }

  resetProject() {
    const graph =
      createInitialProjectGraph();

    this.state =
      createProjectControllerState(graph);

    this.emit();
  }

  replaceGraph(graph: ProjectGraph) {
    this.state = { ...this.state, graph };
    this.emit();
  }

  private createSnapshot(): ProjectStoreSnapshot {
    return {
      graph: this.state.graph,
      messages: this.state.messages,
      progress: getProjectProgress(
        this.state.graph
      ),
      state: this.state,
    };
  }

  private emit() {
    this.snapshot = this.createSnapshot();

    this.listeners.forEach((listener) => {
      listener(this.snapshot);
    });
  }
}

export const projectStore =
  new ProjectStore();
