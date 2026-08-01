export interface ExecutiveDecision {
  mode: 'ask' | 'suggest' | 'act';
  explanation: string;
  confidence: number;
  question?: string;
  nextModule?: string;
}
