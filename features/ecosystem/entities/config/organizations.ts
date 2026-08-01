import type { EntityConfig } from '../types/entity-config';

export const organizationsConfig = {
  entity: 'organizations',

  singular: 'Organización',

  plural: 'Organizaciones',

  table: 'organizations',

  description:
    'Organizaciones, colectivos, fundaciones y empresas del ecosistema.',

  icon: 'building',

  color: 'emerald',

  route: '/workspace/ecosystem/organizations',

  searchableFields: [
    'name',
    'description',
  ],

  fields: [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      editable: true,
      sortable: true,
      filterable: false,
      searchable: true,
      visibleInList: true,
      visibleInForm: true,
    },
    {
      key: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: false,
      editable: true,
      sortable: false,
      filterable: false,
      searchable: true,
      visibleInList: true,
      visibleInForm: true,
    },
    {
      key: 'created_at',
      label: 'Creado',
      type: 'date',
      required: false,
      editable: false,
      sortable: true,
      filterable: true,
      searchable: false,
      visibleInList: false,
      visibleInForm: false,
    },
  ],

  permissions: {
    create: true,
    update: true,
    delete: true,
  },

  defaultSort: {
    column: 'created_at',
    ascending: false,
  },

  dashboard: {
    show: true,
    subtitle: 'Aliados del ecosistema',
  },

  navigation: {
    show: true,
    order: 2,
  },
} satisfies EntityConfig;