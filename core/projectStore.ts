import type {
  ConversationMessage,
  ProjectGraph,
  KnowledgeGuidance,
} from '../types/project';

import {
  createInitialProjectGraph,
  getProjectProgress,
} from './projectEngine';

import {
  createProjectControllerState,
  processProjectMessage,
} from './projectController';
import { applyConfirmationCorrection, resolveConfirmation } from '../engines/projectKnowledgeEngine';
import { applyConsistencyEvaluation, evaluateProjectConsistency, resolveConsistencyIssue } from '../engines/projectConsistencyEngine';
import { acceptFinancialProposal, createProposal, initialFinancialAuthorityState, materializeFinancialKnowledge, syncFinancialItemToKnowledge } from '../engines/financialAuthorityEngine';

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

  sendMessage(userInput: string, knowledge?: KnowledgeGuidance) {
    const cleanInput = userInput.trim();

    if (!cleanInput) {
      return;
    }

    const result = processProjectMessage(
      this.state,
      cleanInput,
      knowledge
    );

    this.state = result.state;

    if(process.env.NODE_ENV==='development')console.debug('[ExecutiveEngineV2 runtime]',{stage:'store-committed',projectId:this.state.graph.id,knowledgeEntities:this.state.graph.knowledge?.entities.length??0,financialProposals:this.state.graph.financialAuthority?.proposals.length??0});

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

  resolveKnowledgeConfirmation(confirmationId: string, status: 'accepted'|'rejected'|'dismissed') {
    let graph = resolveConfirmation(this.state.graph, confirmationId, status);
    if (status === 'accepted') {
      const request=graph.knowledge?.confirmations.find(item=>item.id===confirmationId);let financial=graph.financialAuthority??initialFinancialAuthorityState();
      for(const entityId of request?.entityIds??[]){const entity=graph.knowledge?.entities.find(item=>item.id===entityId);if(!entity)continue;const quantityEntity=entity.type==='financial_fact'&&typeof entity.value==='object'&&!Array.isArray(entity.value)&&(entity.value as {unit?:string}).unit==='artista'?graph.knowledge?.entities.find(item=>item.key==='artist_requirement'):undefined;const proposal=materializeFinancialKnowledge({projectId:graph.id,knowledgeEntity:entity,quantityEntity});if(proposal)financial=createProposal(financial,proposal).state;}
      graph={...graph,financialAuthority:financial};
    }
    this.state = { ...this.state, graph: applyConsistencyEvaluation(graph, evaluateProjectConsistency({ graph })) };
    this.emit();
  }

  acceptFinancialProposal(proposalId:string){
    let graph=this.state.graph;const accepted=acceptFinancialProposal(graph.financialAuthority??initialFinancialAuthorityState(),proposalId);const item=accepted.item;
    const legacy={id:item.id,category:item.category,concept:item.concept,quantity:item.quantity,unit:item.unit,unitValue:item.unitPrice.amount,vatRate:0,withholdingRate:0,otherTaxes:item.otherTaxes.amount,status:item.status==='approved'?'approved' as const:item.status==='committed'?'committed' as const:item.status==='paid'?'paid' as const:'proposed' as const,responsible:item.responsibleId??'',provider:item.provider??'',estimatedDate:item.expectedDate??'',actualDate:item.actualDate??'',source:'creative-os' as const};
    graph={...graph,financialAuthority:accepted.state,knowledge:graph.knowledge?syncFinancialItemToKnowledge(graph.knowledge,item):graph.knowledge,tools:{...graph.tools,budgetLines:[...graph.tools.budgetLines.filter(line=>line.id!==item.id),legacy]}};
    this.state={...this.state,graph:applyConsistencyEvaluation(graph,evaluateProjectConsistency({graph}))};this.emit();return item;
  }

  correctKnowledgeConfirmation(confirmationId: string, correction: string) {
    const graph = applyConfirmationCorrection(this.state.graph, confirmationId, correction);
    this.state = { ...this.state, graph: applyConsistencyEvaluation(graph, evaluateProjectConsistency({ graph })) };
    this.emit();
  }

  resolveConsistencyIssue(issueId: string, status: 'acknowledged'|'resolved'|'dismissed', note?: string) {
    this.state = { ...this.state, graph: resolveConsistencyIssue(this.state.graph, issueId, status, note) };
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
