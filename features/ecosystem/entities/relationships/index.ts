import type { RelationshipConfig } from '../types/relationship-config';

export const relationships: RelationshipConfig[] = [
  {
    key: 'people-organization',

    label: 'Organización',

    sourceEntity: 'people',

    targetEntity: 'organizations',

    type: 'belongsTo',

    sourceField: 'organization_id',

    targetField: 'id',

    displayField: 'name',

    visibleInDetail: true,

    visibleInForm: true,

    filterable: true,
  },
];