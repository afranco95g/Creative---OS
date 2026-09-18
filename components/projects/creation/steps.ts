import type { WorkspaceProject } from '@/types/workspace';

/**
 * Tipos y constantes compartidas del wizard híbrido de creación
 * (specs/wizard-creacion-proyectos-hibrido.md). Todo lo que vive aquí
 * es sobre datos que ya existen en Supabase — nature (migración 057)
 * y category (existente) — nunca un vocabulario nuevo inventado en el
 * frontend.
 */

export type ProjectNature = NonNullable<WorkspaceProject['nature']>;

export interface NatureOption {
  id: ProjectNature;
  label: string;
  description: string;
  /** Si el paso 2 (buscar espacio) aplica para esta naturaleza. */
  needsSpace: boolean;
}

export const NATURE_OPTIONS: NatureOption[] = [
  {
    id: 'live_event',
    label: 'Evento en vivo',
    description: 'Un concierto, lanzamiento, activación o encuentro con público presente.',
    needsSpace: true,
  },
  {
    id: 'talk',
    label: 'Conversatorio o charla',
    description: 'Un panel, una charla, una presentación con formato de conversación.',
    needsSpace: true,
  },
  {
    id: 'workshop',
    label: 'Taller',
    description: 'Un proceso formativo o de creación colectiva con sesiones presenciales.',
    needsSpace: true,
  },
  {
    id: 'product',
    label: 'Producto',
    description: 'Un objeto, publicación, pieza audiovisual o material que se produce y se entrega.',
    needsSpace: false,
  },
];

/**
 * Mapeo por defecto de nature -> category (taxonomía editorial ya
 * existente). Es un punto de partida editable en la conversación, no
 * una regla fija: category sigue siendo "¿en qué sección se publica
 * esto?", una pregunta distinta a "¿qué se va a producir?".
 */
export const NATURE_TO_DEFAULT_CATEGORY: Record<
  ProjectNature,
  WorkspaceProject['category']
> = {
  live_event: 'event',
  talk: 'cultural',
  workshop: 'cultural',
  product: 'product',
};

export const NATURE_LABELS: Record<ProjectNature, string> = {
  live_event: 'Evento en vivo',
  talk: 'Conversatorio o charla',
  workshop: 'Taller',
  product: 'Producto',
};

export interface WizardSelectedBooking {
  roomId: string;
  roomName: string;
  spaceName: string;
  startsAt: string;
  endsAt: string;
  eventType: string;
  specialRequests: string;
}

export interface ProjectWizardState {
  step: 1 | 2 | 3;
  nature: ProjectNature | null;
  selectedBooking: WizardSelectedBooking | null;
  /** El usuario decidió explícitamente resolver el espacio después. */
  spaceSkipped: boolean;
}

export const INITIAL_WIZARD_STATE: ProjectWizardState = {
  step: 1,
  nature: null,
  selectedBooking: null,
  spaceSkipped: false,
};
