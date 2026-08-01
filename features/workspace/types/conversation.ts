export interface ConversationStep {

  id: string;

  question: string;

  field: string;

  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'multiselect';

  options?: string[];

  required?: boolean;
}

export interface ConversationFlow {

  id: string;

  title: string;

  description?: string;

  steps: ConversationStep[];
}