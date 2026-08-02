import type {
  WorkspaceContext,
} from '../types/workspace-context';

export const workspaceContexts:
  WorkspaceContext[] = [
    {
      id: 'personal',
      name: 'Personal',
      type: 'personal',
      description:
        'Tu perfil, actividades, conexiones y participación dentro del ecosistema.',
      icon: 'user',
      capabilities: [
        'manage_profile',
        'view_own_activity',
        'join_projects',
        'join_events',
      ],
      modules: [
        'home',
        'profile',
        'agenda',
        'ecosystem',
      ],
    },

    {
      id: 'cultura-esta',
      name: 'Cultura Esta',
      type: 'media',
      description:
        'Gestión editorial, agenda cultural, artistas, proyectos y publicaciones del medio.',
      icon: 'newspaper',
      capabilities: [
        'media_editor',
        'create_article',
        'edit_article',
        'review_content',
        'publish_content',
        'manage_media_agenda',
        'select_featured_artist',
        'select_featured_project',
      ],
      modules: [
        'editorial',
        'articles',
        'agenda',
        'artists',
        'projects',
        'analytics',
      ],
    },

    {
      id: 'oda',
      name: 'ODA',
      type: 'organization',
      description:
        'Proyectos sociales, voluntariado, territorio, equipo e impacto.',
      icon: 'building',
      capabilities: [
        'manage_organization',
        'manage_projects',
        'manage_volunteers',
        'manage_impact',
        'manage_team',
      ],
      modules: [
        'home',
        'projects',
        'volunteers',
        'territories',
        'impact',
        'team',
      ],
    },

    {
      id: 'neon-sessions',
      name: 'Neon Sessions',
      type: 'project',
      description:
        'Producción, artistas, eventos, contenidos, presupuesto y aliados.',
      icon: 'sparkles',
      capabilities: [
        'manage_project',
        'manage_tasks',
        'manage_events',
        'manage_assets',
        'manage_budget',
        'manage_partners',
      ],
      modules: [
        'home',
        'project',
        'tasks',
        'agenda',
        'assets',
        'budget',
        'partners',
      ],
    },
  ];