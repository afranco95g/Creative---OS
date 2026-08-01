import type { ConversationFlow } from '../types/conversation';

export const workspaceConversation: ConversationFlow = {
  id: 'workspace-onboarding',

  title: 'Crear Workspace',

  description:
    'Conozcamos qué quieres construir para preparar tu espacio de trabajo.',

  steps: [
    {
      id: 'workspace-name',
      question: '¿Cómo se llama lo que quieres construir?',
      field: 'name',
      type: 'text',
      required: true,
    },

    {
      id: 'workspace-type',
      question: '¿Qué describe mejor ese espacio?',
      field: 'type',
      type: 'select',
      required: true,
      options: [
        'Proyecto creativo',
        'Organización',
        'Marca',
        'Espacio cultural',
        'Medio de comunicación',
        'Uso personal',
      ],
    },

    {
      id: 'workspace-purpose',
      question:
        'Cuéntame brevemente qué quieres lograr con este Workspace.',
      field: 'purpose',
      type: 'textarea',
      required: true,
    },

    {
      id: 'workspace-team',
      question:
        '¿Trabajarás solo o con otras personas?',
      field: 'team',
      type: 'select',
      options: [
        'Solo',
        'Con un equipo',
        'Todavía no lo sé',
      ],
    },
  ],
};