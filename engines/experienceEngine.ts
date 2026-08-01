export type ExperienceStepType =
  | 'thinking'
  | 'organizing'
  | 'documenting'
  | 'producing'
  | 'ready';

export interface ExperienceStep {
  id: string;
  type: ExperienceStepType;
  label: string;
  description: string;
}

export function buildExperienceSteps(projectTitle: string): ExperienceStep[] {
  return [
    {
      id: 'thinking',
      type: 'thinking',
      label: 'Pensando',
      description: `Estoy analizando lo último que dijiste sobre ${projectTitle}.`,
    },
    {
      id: 'organizing',
      type: 'organizing',
      label: 'Organizando',
      description: 'Estoy actualizando la estructura viva del proyecto.',
    },
    {
      id: 'documenting',
      type: 'documenting',
      label: 'Documentando',
      description: 'Estoy revisando qué documentos avanzan con esta información.',
    },
    {
      id: 'producing',
      type: 'producing',
      label: 'Produciendo',
      description: 'Estoy registrando avances, tareas y próximos pasos.',
    },
    {
      id: 'ready',
      type: 'ready',
      label: 'Listo',
      description: 'Ya tengo una siguiente acción clara para continuar.',
    },
  ];
}