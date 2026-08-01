export type UserRole =
  | 'member'
  | 'collaborator'
  | 'editor'
  | 'admin'
  | 'super_admin';

export type WorkspaceModuleStatus =
  | 'active'
  | 'coming_soon';

export interface WorkspaceModule {
  id: string;
  title: string;
  description: string;
  href: string;
  status: WorkspaceModuleStatus;
  allowedRoles: UserRole[];
}

export interface WorkspaceSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  modules: WorkspaceModule[];
}

const ALL_AUTHENTICATED_ROLES: UserRole[] = [
  'member',
  'collaborator',
  'editor',
  'admin',
  'super_admin',
];

const PRODUCTION_ROLES: UserRole[] = [
  'collaborator',
  'editor',
  'admin',
  'super_admin',
];

const EDITORIAL_ROLES: UserRole[] = [
  'editor',
  'admin',
  'super_admin',
];

const ADMIN_ROLES: UserRole[] = [
  'admin',
  'super_admin',
];

export const workspaceSections: WorkspaceSection[] = [
  {
    id: 'editorial',
    eyebrow: 'El medio',
    title: 'Editorial',
    description:
      'Herramientas exclusivas para los periodistas y responsables editoriales de Cultura Está.',
    modules: [
      {
        id: 'stories',
        title: 'Historias',
        description:
          'Crear, editar y publicar artículos, entrevistas, reportajes, opinión, fotohistorias y documentales.',
        href: '/admin/stories',
        status: 'active',
        allowedRoles: EDITORIAL_ROLES,
      },
      {
        id: 'editorial-calendar',
        title: 'Calendario editorial',
        description:
          'Planear coberturas, publicaciones, investigaciones y entregas del equipo periodístico.',
        href: '/admin/editorial-calendar',
        status: 'coming_soon',
        allowedRoles: EDITORIAL_ROLES,
      },
    ],
  },
  {
    id: 'ecosystem',
    eyebrow: 'La red',
    title: 'Ecosistema',
    description:
      'Perfiles y relaciones entre las personas, espacios, proyectos y organizaciones culturales.',
    modules: [
      {
        id: 'people',
        title: 'Personas',
        description:
          'Explorar perfiles, trayectorias, habilidades y conexiones dentro del ecosistema.',
        href: '/workspace/people',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      {
        id: 'organizations',
        title: 'Organizaciones',
        description:
          'Conocer colectivos, medios, fundaciones, instituciones y empresas culturales.',
        href: '/workspace/organizations',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      {
        id: 'spaces',
        title: 'Espacios',
        description:
          'Descubrir talleres, estudios, galerías, salas, residencias y espacios independientes.',
        href: '/workspace/spaces',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      {
        id: 'projects',
        title: 'Proyectos',
        description:
          'Explorar iniciativas culturales, conocer sus equipos y encontrar formas de participar.',
        href: '/workspace/projects',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
    ],
  },
  {
    id: 'experiences',
    eyebrow: 'Participar',
    title: 'Experiencias',
    description:
      'Actividades que conectan a las personas con procesos culturales físicos y digitales.',
    modules: [
      {
        id: 'agenda',
        title: 'Agenda',
        description:
          'Guardar y descubrir eventos, conciertos, exhibiciones, encuentros y actividades.',
        href: '/workspace/agenda',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      {
        id: 'opportunities',
        title: 'Convocatorias',
        description:
          'Encontrar becas, residencias, estímulos, llamados abiertos y oportunidades laborales.',
        href: '/workspace/opportunities',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      {
        id: 'workshops',
        title: 'Talleres',
        description:
          'Acceder a experiencias formativas, laboratorios y procesos de aprendizaje.',
        href: '/workspace/workshops',
        status: 'coming_soon',
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
    ],
  },
  {
    id: 'studio',
    eyebrow: 'Crear',
    title: 'Studio',
    description:
      'Herramientas de producción para organizar, fortalecer y convertir ideas en proyectos realizables.',
    modules: [
      {
        id: 'my-projects',
        title: 'Mis proyectos',
        description:
          'Organizar objetivos, tareas, equipo, presupuesto, documentos y avances.',
        href: '/workspace/studio/projects',
        status: 'coming_soon',
        allowedRoles: PRODUCTION_ROLES,
      },
      {
        id: 'production-board',
        title: 'Producción',
        description:
          'Coordinar cronogramas, entregables, responsables, recursos y riesgos.',
        href: '/workspace/studio/production',
        status: 'coming_soon',
        allowedRoles: PRODUCTION_ROLES,
      },
      {
        id: 'creative-assistant',
        title: 'Asistente creativo',
        description:
          'Usar inteligencia artificial para estructurar ideas sin reemplazar la visión creativa.',
        href: '/workspace/studio/assistant',
        status: 'coming_soon',
        allowedRoles: PRODUCTION_ROLES,
      },
    ],
  },
  {
    id: 'administration',
    eyebrow: 'Operación',
    title: 'Administración',
    description:
      'Configuración, usuarios, permisos y operación interna de Cultura Está.',
    modules: [
      {
        id: 'users',
        title: 'Usuarios y roles',
        description:
          'Administrar accesos y asignar responsabilidades dentro de la plataforma.',
        href: '/admin/users',
        status: 'coming_soon',
        allowedRoles: ADMIN_ROLES,
      },
      {
        id: 'settings',
        title: 'Configuración',
        description:
          'Gestionar categorías, navegación, parámetros y funcionamiento general.',
        href: '/admin/settings',
        status: 'coming_soon',
        allowedRoles: ADMIN_ROLES,
      },
    ],
  },
];

export function getWorkspaceSectionsForRole(
  role: UserRole
): WorkspaceSection[] {
  return workspaceSections
    .map((section) => ({
      ...section,
      modules: section.modules.filter((module) =>
        module.allowedRoles.includes(role)
      ),
    }))
    .filter((section) => section.modules.length > 0);
}