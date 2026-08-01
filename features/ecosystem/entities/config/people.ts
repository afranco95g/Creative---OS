import type { EntityConfig } from '../types/entity-config';

export const peopleConfig = {
  entity: 'people',

  singular: 'Persona',

  plural: 'Personas',

  table: 'people',

  description:
    'Personas, artistas, gestores, periodistas y miembros del ecosistema cultural.',

  icon: 'users',

  color: 'blue',

  route: '/workspace/ecosystem/people',

  searchableFields: [
    'first_name',
    'last_name',
    'email',
  ],

  fields: [
    {
      key: 'first_name',
      label: 'Nombre',
      type: 'text',
      required: true,
      editable: true,
      sortable: true,
      filterable: false,
      searchable: true,
      visibleInList: true,
      visibleInForm: true,
      placeholder: 'Nombre de la persona',
    },
    {
      key: 'last_name',
      label: 'Apellido',
      type: 'text',
      required: true,
      editable: true,
      sortable: true,
      filterable: false,
      searchable: true,
      visibleInList: true,
      visibleInForm: true,
      placeholder: 'Apellido de la persona',
    },
    {
      key: 'email',
      label: 'Correo electrónico',
      type: 'email',
      required: false,
      editable: true,
      sortable: true,
      filterable: false,
      searchable: true,
      visibleInList: true,
      visibleInForm: true,
      placeholder: 'correo@ejemplo.com',
    },
    {
      key: 'organization_id',
      label: 'Organización',
      type: 'relation',
      required: false,
      editable: true,
      sortable: true,
      filterable: true,
      searchable: false,
      visibleInList: true,
      visibleInForm: true,
      placeholder: 'Selecciona una organización',

      relationshipKey: 'people-organization',

      relation: {
        entity: 'organizations',
        displayField: 'name',
        valueField: 'id',
      },
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
    subtitle: 'Personas del ecosistema',
  },

  navigation: {
    show: true,
    order: 1,
  },
} satisfies EntityConfig;