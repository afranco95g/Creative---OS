export const ENTITY_TYPES = [
  'person',
  'organization',
  'project',
  'space',
  'story',
  'event',
  'workshop',
  'opportunity',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  'founded',
  'works_at',
  'member_of',
  'collaborates_with',
  'directs',
  'produces',
  'participates_in',
  'facilitates',
  'manages',
  'develops',
  'organizes',
  'hosts',
  'occurs_at',
  'belongs_to',
  'produces_event',
  'produces_story',
  'covers',
  'mentions',
  'wrote',
  'photographed',
  'filmed',
  'funds',
  'supports',
  'awarded_to',
  'uses_space',
] as const;

export type RelationshipType =
  (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_STATUSES = [
  'suggested',
  'pending',
  'verified',
  'rejected',
  'archived',
] as const;

export type RelationshipStatus =
  (typeof RELATIONSHIP_STATUSES)[number];

export interface Relationship {
  id: string;

  sourceType: EntityType;

  sourceId: string;

  relationshipType: RelationshipType;

  targetType: EntityType;

  targetId: string;

  startsAt?: string;

  endsAt?: string;

  status: RelationshipStatus;

  confidence: number;

  sourceUrl?: string;

  notes?: string;

  createdBy?: string;

  createdAt: string;

  updatedAt: string;
}

export interface RelationshipDefinition {
  type: RelationshipType;

  label: string;

  inverseLabel: string;

  allowedSources: EntityType[];

  allowedTargets: EntityType[];

  description: string;
}

export const RELATIONSHIP_DEFINITIONS: RelationshipDefinition[] = [
  {
    type: 'founded',
    label: 'fundó',
    inverseLabel: 'fue fundada por',
    allowedSources: ['person'],
    allowedTargets: ['organization'],
    description:
      'Indica que una persona participó en la fundación de una organización.',
  },
  {
    type: 'works_at',
    label: 'trabaja en',
    inverseLabel: 'cuenta con',
    allowedSources: ['person'],
    allowedTargets: ['organization'],
    description:
      'Representa una relación laboral vigente o histórica.',
  },
  {
    type: 'member_of',
    label: 'es miembro de',
    inverseLabel: 'tiene como miembro a',
    allowedSources: ['person'],
    allowedTargets: ['organization'],
    description:
      'Indica pertenencia a un colectivo, institución u organización.',
  },
  {
    type: 'collaborates_with',
    label: 'colabora con',
    inverseLabel: 'colabora con',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['person', 'organization'],
    description:
      'Representa una colaboración sin implicar pertenencia o vínculo laboral.',
  },
  {
    type: 'directs',
    label: 'dirige',
    inverseLabel: 'es dirigido por',
    allowedSources: ['person'],
    allowedTargets: ['project', 'event', 'workshop'],
    description:
      'Indica responsabilidad de dirección creativa, artística o ejecutiva.',
  },
  {
    type: 'produces',
    label: 'produce',
    inverseLabel: 'es producido por',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['project', 'event', 'story', 'workshop'],
    description:
      'Representa responsabilidad de producción sobre una iniciativa.',
  },
  {
    type: 'participates_in',
    label: 'participa en',
    inverseLabel: 'tiene como participante a',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['project', 'event', 'workshop'],
    description:
      'Indica participación sin precisar una responsabilidad de dirección.',
  },
  {
    type: 'facilitates',
    label: 'facilita',
    inverseLabel: 'es facilitado por',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['workshop', 'event'],
    description:
      'Representa el acompañamiento o facilitación de una experiencia formativa.',
  },
  {
    type: 'manages',
    label: 'gestiona',
    inverseLabel: 'es gestionado por',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['space', 'project'],
    description:
      'Indica responsabilidad administrativa u operativa.',
  },
  {
    type: 'develops',
    label: 'desarrolla',
    inverseLabel: 'es desarrollado por',
    allowedSources: ['organization'],
    allowedTargets: ['project', 'workshop'],
    description:
      'Indica que una organización desarrolla un proceso o programa.',
  },
  {
    type: 'organizes',
    label: 'organiza',
    inverseLabel: 'es organizado por',
    allowedSources: ['person', 'organization', 'project'],
    allowedTargets: ['event', 'workshop'],
    description:
      'Representa la responsabilidad organizativa de una actividad.',
  },
  {
    type: 'hosts',
    label: 'alberga',
    inverseLabel: 'ocurre en',
    allowedSources: ['space'],
    allowedTargets: ['event', 'workshop'],
    description:
      'Indica que un espacio alberga una actividad.',
  },
  {
    type: 'occurs_at',
    label: 'ocurre en',
    inverseLabel: 'alberga',
    allowedSources: ['project', 'event', 'workshop'],
    allowedTargets: ['space'],
    description:
      'Conecta una actividad o proceso con el espacio donde ocurre.',
  },
  {
    type: 'belongs_to',
    label: 'pertenece a',
    inverseLabel: 'contiene',
    allowedSources: ['event', 'workshop'],
    allowedTargets: ['project'],
    description:
      'Indica que una actividad forma parte de un proyecto más amplio.',
  },
  {
    type: 'produces_event',
    label: 'produce el evento',
    inverseLabel: 'es producido por el proyecto',
    allowedSources: ['project'],
    allowedTargets: ['event'],
    description:
      'Indica que un evento es resultado o componente de un proyecto.',
  },
  {
    type: 'produces_story',
    label: 'genera la historia',
    inverseLabel: 'surge de',
    allowedSources: ['project', 'event', 'workshop'],
    allowedTargets: ['story'],
    description:
      'Conecta un proceso cultural con una publicación editorial resultante.',
  },
  {
    type: 'covers',
    label: 'cubre',
    inverseLabel: 'es cubierto por',
    allowedSources: ['story'],
    allowedTargets: [
      'person',
      'organization',
      'project',
      'space',
      'event',
      'workshop',
      'opportunity',
    ],
    description:
      'Indica que una historia tiene una entidad como tema principal.',
  },
  {
    type: 'mentions',
    label: 'menciona',
    inverseLabel: 'es mencionado en',
    allowedSources: ['story'],
    allowedTargets: [
      'person',
      'organization',
      'project',
      'space',
      'event',
      'workshop',
      'opportunity',
    ],
    description:
      'Indica una referencia secundaria dentro de una historia.',
  },
  {
    type: 'wrote',
    label: 'escribió',
    inverseLabel: 'fue escrita por',
    allowedSources: ['person'],
    allowedTargets: ['story'],
    description:
      'Representa la autoría periodística o editorial de una historia.',
  },
  {
    type: 'photographed',
    label: 'fotografió',
    inverseLabel: 'fue fotografiado por',
    allowedSources: ['person'],
    allowedTargets: ['person', 'project', 'space', 'event', 'workshop'],
    description:
      'Indica autoría fotográfica relacionada con una entidad.',
  },
  {
    type: 'filmed',
    label: 'filmó',
    inverseLabel: 'fue filmado por',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['project', 'space', 'event', 'workshop'],
    description:
      'Indica responsabilidad de registro o producción audiovisual.',
  },
  {
    type: 'funds',
    label: 'financia',
    inverseLabel: 'es financiado por',
    allowedSources: ['organization', 'opportunity'],
    allowedTargets: ['person', 'organization', 'project', 'event', 'workshop'],
    description:
      'Representa la entrega de recursos financieros.',
  },
  {
    type: 'supports',
    label: 'apoya',
    inverseLabel: 'recibe apoyo de',
    allowedSources: ['person', 'organization'],
    allowedTargets: ['person', 'organization', 'project', 'event', 'workshop'],
    description:
      'Representa apoyo no necesariamente financiero.',
  },
  {
    type: 'awarded_to',
    label: 'fue otorgada a',
    inverseLabel: 'recibió',
    allowedSources: ['opportunity'],
    allowedTargets: ['person', 'organization', 'project'],
    description:
      'Indica quién recibió una beca, premio, estímulo o residencia.',
  },
  {
    type: 'uses_space',
    label: 'utiliza el espacio',
    inverseLabel: 'es utilizado por',
    allowedSources: ['person', 'organization', 'project'],
    allowedTargets: ['space'],
    description:
      'Representa el uso habitual o temporal de un espacio.',
  },
];

export function getRelationshipDefinition(
  type: RelationshipType
): RelationshipDefinition | undefined {
  return RELATIONSHIP_DEFINITIONS.find(
    (definition) => definition.type === type
  );
}

export function getAllowedRelationships(
  sourceType: EntityType,
  targetType?: EntityType
): RelationshipDefinition[] {
  return RELATIONSHIP_DEFINITIONS.filter((definition) => {
    const acceptsSource =
      definition.allowedSources.includes(sourceType);

    const acceptsTarget = targetType
      ? definition.allowedTargets.includes(targetType)
      : true;

    return acceptsSource && acceptsTarget;
  });
}

export function isValidRelationship(
  sourceType: EntityType,
  relationshipType: RelationshipType,
  targetType: EntityType
): boolean {
  const definition = getRelationshipDefinition(
    relationshipType
  );

  if (!definition) {
    return false;
  }

  return (
    definition.allowedSources.includes(sourceType) &&
    definition.allowedTargets.includes(targetType)
  );
}