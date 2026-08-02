'use client';

import Link from 'next/link';

import {
  useMemo,
  useSyncExternalStore,
} from 'react';

import LogoutButton from './admin/LogoutButton';

import {
  ProjectCloudPanel,
} from './ProjectCloudPanel';

import {
  EntitySwitcher,
} from './ecosystem/EntitySwitcher';

import type {
  EcosystemEntityOption,
  EcosystemEntityType,
} from './ecosystem/EntitySwitcher';

import {
  workspaceStore,
} from '../core/workspaceStore';

import type {
  WorkspaceState,
} from '../types/workspace';
import {
  WorkspaceActorBridge,
} from './workspace/WorkspaceActorBridge';



export interface MyEcosystemProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  onboardingPath: string;
  onboardingStatus: string;
  isActive: boolean;
}

export interface MyEcosystemPerson {
  id: string;
  fullName: string;
  slug: string;
  headline: string | null;
  biography: string | null;
  avatarUrl: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  roles: string[];
  skills: string[];
  interests: string[];
  verified: boolean;
  featured: boolean;
  status: string;
}

export interface MyEcosystemSpace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  capacity: number | null;
  spaceTypes: string[];
  offers: string[];
  needs: string[];
  verified: boolean;
  featured: boolean;
  status: string;
  membershipRole: string;
  membershipStatus: string;
}

export interface MyEcosystemFunder {
  id: string;
  name: string;
  slug: string;
  funderType: string;
  description: string | null;
  city: string | null;
  country: string | null;
  interests: string[];
  supportModes: string[];
  verified: boolean;
  featured: boolean;
  status: string;
  membershipRole: string;
  membershipStatus: string;
}

interface MyEcosystemDashboardProps {
  profile: MyEcosystemProfile;
  person: MyEcosystemPerson | null;
  spaces: MyEcosystemSpace[];
  funders: MyEcosystemFunder[];
  warnings: string[];
}

interface SelectedEntity {
  key: string;
  type: EcosystemEntityType;
  person?: MyEcosystemPerson;
  space?: MyEcosystemSpace;
  funder?: MyEcosystemFunder;
}

const roleLabels: Record<string, string> = {
  member: 'Miembro del ecosistema',
  journalist: 'Periodista',
  media_admin: 'Administrador del medio',
  ecosystem_admin: 'Administrador del ecosistema',
  super_admin: 'Superadministrador',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
  invited: 'Invitación pendiente',
  active: 'Activo',
  inactive: 'Inactivo',
  not_started: 'Sin comenzar',
  in_progress: 'En construcción',
  completed: 'Completado',
};

const categoryLabels: Record<string, string> = {
  cultural: 'Cultural',
  product: 'Producto',
  event: 'Evento',
  social: 'Social',
  artistic: 'Artístico',
  business: 'Negocio',
  other: 'Otro',
};

const actorTypeLabels: Record<string, string> = {
  person: 'Persona',
  space: 'Espacio',
  funder: 'Marca o financiador',
};

const funderTypeLabels: Record<string, string> = {
  brand: 'Marca',
  company: 'Empresa',
  foundation: 'Fundación',
  public_entity: 'Entidad pública',
  agency: 'Agencia',
  individual: 'Persona financiadora',
  other: 'Otra organización',
};

export function MyEcosystemDashboard({
  profile,
  person,
  spaces,
  funders,
  warnings,
}: MyEcosystemDashboardProps) {
  const workspaceState =
    useSyncExternalStore<WorkspaceState | null>(
      (listener) =>
        workspaceStore.subscribe(
          () => listener()
        ),

      () =>
        workspaceStore.getSnapshot(),

      () =>
        null
    );

  

  const allProjects =
    workspaceState?.projects ?? [];

  const workspaceActors =
    workspaceState?.actors ?? [];

  const activeActorId =
    workspaceState?.activeActorId ??
    null;

  const projects =
    activeActorId
      ? allProjects.filter(
          (project) =>
            project.actorId ===
            activeActorId
        )
      : [];

  const selectedEntityId =
    activeActorId ?? '';

  const entities =
    useMemo<
      EcosystemEntityOption[]
    >(
      () =>
        workspaceActors.map(
          (actor) => ({
            id:
              actor.id,

            type:
              actor.type ===
              'funder'
                ? 'brand'
                : actor.type,

            name:
              actor.name,

            description:
              actor.description ||
              getDefaultActorDescription(
                actor.type
              ),

            badge:
              getActorBadge(
                actor.type,
                actor.role
              ),

            verified:
              actor.verified,
          })
        ),
      [
        workspaceActors,
      ]
    );

  const selectedEntity =
    useMemo<
      SelectedEntity | null
    >(
      () => {
        if (!selectedEntityId) {
          return null;
        }

        const [
          type,
          entityId,
        ] =
          selectedEntityId.split(
            ':'
          );

        if (
          type === 'person' &&
          person?.id === entityId
        ) {
          return {
            key:
              selectedEntityId,

            type:
              'person',

            person,
          };
        }

        if (type === 'space') {
          const selectedSpace =
            spaces.find(
              (space) =>
                space.id ===
                entityId
            );

          return selectedSpace
            ? {
                key:
                  selectedEntityId,

                type:
                  'space',

                space:
                  selectedSpace,
              }
            : null;
        }

        if (type === 'brand') {
          const selectedFunder =
            funders.find(
              (funder) =>
                funder.id ===
                entityId
            );

          return selectedFunder
            ? {
                key:
                  selectedEntityId,

                type:
                  'brand',

                funder:
                  selectedFunder,
              }
            : null;
        }

        return null;
      },
      [
        funders,
        person,
        selectedEntityId,
        spaces,
      ]
    );

  const canReviewEligibility =
    profile.role ===
      'ecosystem_admin' ||
    profile.role ===
      'super_admin';

  const canReviewEditorial =
    profile.role ===
      'media_admin' ||
    profile.role ===
      'super_admin';

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <WorkspaceActorBridge
        person={person}
        spaces={spaces}
        funders={funders}
      />
      <header className="border-b border-white/10 bg-[#080808] px-6 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="text-sm text-[#777777] transition hover:text-white"
              >
                ← Volver al medio
              </Link>

              <span className="text-[#333333]">
                /
              </span>

              <Link
                href="/studio"
                className="text-sm text-[#777777] transition hover:text-white"
              >
                Creative OS
              </Link>
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
              Cultura Esta
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Mi Ecosistema
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canReviewEligibility ? (
              <>
                <Link
                  href="/revision-actores"
                  className="rounded-full border border-[#D9FF00]/30 px-5 py-3 text-sm font-semibold text-[#D9FF00] transition hover:bg-[#D9FF00] hover:text-black"
                >
                  Revisar actores
                </Link>

                <Link
                  href="/revision-ecosistema"
                  className="rounded-full border border-[#D9FF00]/30 px-5 py-3 text-sm font-semibold text-[#D9FF00] transition hover:bg-[#D9FF00] hover:text-black"
                >
                  Revisar elegibilidad
                </Link>
              </>
            ) : null}

            {canReviewEditorial ? (
              <Link
                href="/revision-editorial"
                className="rounded-full border border-[#D9FF00]/30 px-5 py-3 text-sm font-semibold text-[#D9FF00] transition hover:bg-[#D9FF00] hover:text-black"
              >
                Revisión editorial
              </Link>
            ) : null}

            <Link
              href="/workspace/ecosystem"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white"
            >
              Explorar actores
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
            >
              Crear proyecto
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 sm:px-8 lg:px-12">
        {warnings.length > 0 ? (
          <WarningsPanel
            warnings={warnings}
          />
        ) : null}

        <AccountSummary
          profile={profile}
          projectsCount={
            allProjects.length
          }
          spacesCount={
            spaces.length
          }
          fundersCount={
            funders.length
          }
          verified={
            person?.verified ??
            false
          }
        />

        {entities.length > 0 ? (
          <EntitySwitcher
            entities={entities}
            selectedEntityId={selectedEntityId}
            onSelect={(actorId) =>
              workspaceStore.selectActor(
                actorId
              )
            }
          />
        ) : (
          <EmptyState
            title="Tu cuenta todavía no tiene una entidad asociada"
            description="No encontramos un perfil, espacio, marca, agencia u organización vinculada a esta cuenta. Revisa que el registro haya creado correctamente el actor y su membresía en Supabase."
          />
        )}

        {selectedEntity?.type ===
          'person' ? (
          <PersonPlatform
            person={
              selectedEntity.person ??
              null
            }
            projects={
              projects
            }
            workspaceState={
              workspaceState
            }
          />
        ) : null}

        {selectedEntity?.type ===
          'space' &&
        selectedEntity.space ? (
          <SpacePlatform
            space={
              selectedEntity.space
            }
            projects={
              projects
            }
            workspaceState={
              workspaceState
            }
          />
        ) : null}

        {selectedEntity?.type ===
          'brand' &&
        selectedEntity.funder ? (
          <BrandPlatform
            funder={
              selectedEntity.funder
            }
            projects={
              projects
            }
            workspaceState={
              workspaceState
            }
          />
        ) : null}
      </div>
    </main>
  );
}

function AccountSummary({
  profile,
  projectsCount,
  spacesCount,
  fundersCount,
  verified,
}: {
  profile: MyEcosystemProfile;
  projectsCount: number;
  spacesCount: number;
  fundersCount: number;
  verified: boolean;
}) {
  return (
    <section className="rounded-[36px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <SectionEyebrow>
            Cuenta activa
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">
            {profile.fullName}
          </h2>

          <p className="mt-3 text-[#A6A6A6]">
            {profile.email}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <StatusPill
              value={
                roleLabels[
                  profile.role
                ] ??
                profile.role
              }
              accent
            />

            <StatusPill
              value={
                actorTypeLabels[
                  profile.onboardingPath
                ] ??
                profile.onboardingPath
              }
            />

            <StatusPill
              value={
                statusLabels[
                  profile.onboardingStatus
                ] ??
                profile.onboardingStatus
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
          <Metric
            value={String(
              projectsCount
            )}
            label="Proyectos"
          />

          <Metric
            value={String(
              spacesCount
            )}
            label="Espacios"
          />

          <Metric
            value={String(
              fundersCount
            )}
            label="Marcas"
          />

          <Metric
            value={
              verified
                ? 'Sí'
                : 'No'
            }
            label="Verificado"
          />
        </div>
      </div>
    </section>
  );
}

function PersonPlatform({
  person,
  projects,
  workspaceState,
}: {
  person:
    | MyEcosystemPerson
    | null;

  projects: WorkspaceState['projects'];

  workspaceState:
    | WorkspaceState
    | null;
}) {
  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-7">
          <SectionEyebrow>
            Plataforma personal
          </SectionEyebrow>

          <h2 className="mt-3 text-2xl font-bold">
            Mi perfil
          </h2>

          {person ? (
            <>
              <div className="mt-6 flex items-center gap-4">
                <Avatar
                  name={
                    person.fullName
                  }
                  imageUrl={
                    person.avatarUrl
                  }
                />

                <div>
                  <h3 className="text-xl font-semibold">
                    {
                      person.fullName
                    }
                  </h3>

                  <p className="mt-1 text-sm text-[#777777]">
                    {person.headline ||
                      'Perfil creativo en construcción'}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-[#A6A6A6]">
                {person.biography ||
                  'Todavía no has añadido una biografía.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <StatusPill
                  value={
                    statusLabels[
                      person.status
                    ] ??
                    person.status
                  }
                />

                {person.roles.map(
                  (role) => (
                    <StatusPill
                      key={role}
                      value={formatLabel(
                        role
                      )}
                    />
                  )
                )}
              </div>

              <ProfileInformation
                label="Ubicación"
                value={
                  [
                    person.city,
                    person.department,
                    person.country,
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                  'Sin definir'
                }
              />

              <ProfileInformation
                label="Habilidades"
                value={
                  person.skills.length >
                  0
                    ? person.skills
                        .map(
                          formatLabel
                        )
                        .join(', ')
                    : 'Sin definir'
                }
              />

              <ProfileInformation
                label="Intereses"
                value={
                  person.interests
                    .length > 0
                    ? person.interests
                        .map(
                          formatLabel
                        )
                        .join(', ')
                    : 'Sin definir'
                }
              />
            </>
          ) : (
            <EmptyState
              title="Tu ficha personal necesita completarse"
              description="La cuenta existe, pero todavía no encontramos una persona asociada completamente en Supabase."
            />
          )}
        </article>

        <ProjectsPanel
          projects={projects}
          workspaceState={
            workspaceState
          }
        />
      </section>

      <PublicationProcess />
    </>
  );
}

function ProjectsPanel({
  projects,
  workspaceState,
}: {
  projects: WorkspaceState['projects'];

  workspaceState:
    | WorkspaceState
    | null;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SectionEyebrow>
            Creative OS
          </SectionEyebrow>

          <h2 className="mt-3 text-2xl font-bold">
            Proyectos de esta identidad
          </h2>
        </div>

        <Link
          href="/studio?new=1"
          className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
        >
          Nuevo proyecto
        </Link>
      </div>

      <ProjectCloudPanel />

      {!workspaceState ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-[#151515]" />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Todavía no tienes proyectos"
          description="Crea una Mesa de Producción y comienza a estructurar una idea con el Productor Ejecutivo."
        />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map(
            (project) => (
              <Link
                key={project.id}
                href={`/studio/projects/${project.id}`}
                onClick={() =>
                  workspaceStore.selectProject(
                    project.id
                  )
                }
                className="rounded-2xl border border-white/10 bg-[#111111] p-5 transition hover:border-[#D9FF00]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#767676]">
                  {categoryLabels[
                    project.category
                  ] ??
                    project.category}
                </p>

                <h3 className="mt-3 text-xl font-semibold">
                  {project.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#888888]">
                  {project.description ||
                    'Proyecto sin descripción inicial.'}
                </p>

                <p className="mt-5 text-sm font-semibold text-[#D9FF00]">
                  Abrir Mesa de Producción →
                </p>
              </Link>
            )
          )}
        </div>
      )}
    </article>
  );
}

function SpacePlatform({
  space,
  projects,
  workspaceState,
}: {
  space: MyEcosystemSpace;

  projects:
    WorkspaceState['projects'];

  workspaceState:
    | WorkspaceState
    | null;
}) {
  return (
    <section className="space-y-6">
      <article className="rounded-[36px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <SectionEyebrow>
              Plataforma de espacio
            </SectionEyebrow>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">
              {space.name}
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#A6A6A6]">
              {space.description ||
                'Este espacio todavía necesita completar su presentación.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <StatusPill
                value={
                  statusLabels[
                    space.status
                  ] ??
                  space.status
                }
                accent
              />

              <StatusPill
                value={formatLabel(
                  space.membershipRole
                )}
              />

              {space.verified ? (
                <StatusPill
                  value="Verificado"
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/gestion-agenda"
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
            >
              Gestionar experiencias
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white"
            >
              Crear proyecto
            </Link>
          </div>
        </div>
      </article>

      <ProjectsPanel
        projects={projects}
        workspaceState={
          workspaceState
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <InformationCard
          title="Información básica"
          items={[
            {
              label:
                'Ubicación',

              value:
                [
                  space.city,
                  space.department,
                  space.country,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                'Sin definir',
            },
            {
              label:
                'Capacidad',

              value:
                space.capacity
                  ? `${space.capacity} personas`
                  : 'Sin definir',
            },
          ]}
        />

        <InformationCard
          title="Tipos de espacio"
          items={[
            {
              label:
                'Clasificación',

              value:
                space.spaceTypes
                  .length > 0
                  ? space.spaceTypes
                      .map(
                        formatLabel
                      )
                      .join(', ')
                  : 'Sin definir',
            },
          ]}
        />

        <InformationCard
          title="Servicios y necesidades"
          items={[
            {
              label:
                'Ofrece',

              value:
                space.offers.length >
                0
                  ? space.offers
                      .map(
                        formatLabel
                      )
                      .join(', ')
                  : 'Sin definir',
            },
            {
              label:
                'Necesita',

              value:
                space.needs.length >
                0
                  ? space.needs
                      .map(
                        formatLabel
                      )
                      .join(', ')
                  : 'Sin definir',
            },
          ]}
        />
      </div>

      <NextPlatformStage
        title="Próxima etapa: gestión integral del espacio"
        description="Aquí conectaremos la edición del perfil, galería, infraestructura, disponibilidad, solicitudes, programación y métricas del espacio."
      />
    </section>
  );
}

function BrandPlatform({
  funder,
  projects,
  workspaceState,
}: {
  funder: MyEcosystemFunder;

  projects:
    WorkspaceState['projects'];

  workspaceState:
    | WorkspaceState
    | null;
}) {
  return (
    <section className="space-y-6">
      <article className="rounded-[36px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <SectionEyebrow>
              Plataforma de marca
            </SectionEyebrow>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">
              {funder.name}
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#A6A6A6]">
              {funder.description ||
                'Esta organización todavía necesita completar su presentación.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <StatusPill
                value={
                  funderTypeLabels[
                    funder.funderType
                  ] ??
                  formatLabel(
                    funder.funderType
                  )
                }
                accent
              />

              <StatusPill
                value={
                  statusLabels[
                    funder.status
                  ] ??
                  funder.status
                }
              />

              <StatusPill
                value={formatLabel(
                  funder.membershipRole
                )}
              />

              {funder.verified ? (
                <StatusPill
                  value="Verificado"
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/gestion-financiacion"
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
            >
              Gestionar oportunidades
            </Link>

            <Link
              href="/workspace/ecosystem"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white"
            >
              Explorar ecosistema
            </Link>
          </div>
        </div>
      </article>

      <ProjectsPanel
        projects={projects}
        workspaceState={
          workspaceState
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <InformationCard
          title="Información básica"
          items={[
            {
              label:
                'Tipo',

              value:
                funderTypeLabels[
                  funder.funderType
                ] ??
                formatLabel(
                  funder.funderType
                ),
            },
            {
              label:
                'Ubicación',

              value:
                [
                  funder.city,
                  funder.country,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                'Sin definir',
            },
          ]}
        />

        <InformationCard
          title="Intereses"
          items={[
            {
              label:
                'Áreas de interés',

              value:
                funder.interests
                  .length > 0
                  ? funder.interests
                      .map(
                        formatLabel
                      )
                      .join(', ')
                  : 'Sin definir',
            },
          ]}
        />

        <InformationCard
          title="Modalidades de apoyo"
          items={[
            {
              label:
                'Puede aportar',

              value:
                funder.supportModes
                  .length > 0
                  ? funder.supportModes
                      .map(
                        formatLabel
                      )
                      .join(', ')
                  : 'Sin definir',
            },
          ]}
        />
      </div>

      <NextPlatformStage
        title="Próxima etapa: plataforma comercial de marca"
        description="Aquí conectaremos productos, experiencias compatibles, activaciones, distribución dentro de tickets, resultados y reportes."
      />

      <Link
        href="/productos/gestionar"
        className="inline-flex bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
      >
        Gestionar productos
      </Link>
    </section>
  );
}

function PublicationProcess() {
  return (
    <section className="rounded-[36px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
      <SectionEyebrow>
        Publicación
      </SectionEyebrow>

      <h2 className="mt-3 text-3xl font-bold">
        Cómo llegará un proyecto al medio
      </h2>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-[#A6A6A6]">
        Crear un proyecto no significa publicarlo. Primero
        debe desarrollarse en Creative OS, pasar la revisión
        de elegibilidad y después ser postulado por su
        propietario.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <ProcessStep
          number="01"
          title="Privado"
          description="Solo lo ve su equipo."
        />

        <ProcessStep
          number="02"
          title="Solicita revisión"
          description="El propietario pide elegibilidad."
        />

        <ProcessStep
          number="03"
          title="Elegible"
          description="El ecosistema lo acepta."
        />

        <ProcessStep
          number="04"
          title="Postulado"
          description="Se envía voluntariamente al medio."
        />

        <ProcessStep
          number="05"
          title="Revisión editorial"
          description="El equipo editorial revisa."
        />

        <ProcessStep
          number="06"
          title="Publicado"
          description="Aparece en Cultura Esta."
        />
      </div>
    </section>
  );
}

function WarningsPanel({
  warnings,
}: {
  warnings: string[];
}) {
  return (
    <section className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
        Información incompleta
      </p>

      <div className="mt-3 space-y-2">
        {warnings.map(
          (warning) => (
            <p
              key={warning}
              className="text-sm leading-6 text-amber-100/70"
            >
              {warning}
            </p>
          )
        )}
      </div>
    </section>
  );
}

function InformationCard({
  title,
  items,
}: {
  title: string;

  items: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6">
      <h3 className="text-xl font-bold">
        {title}
      </h3>

      <div className="mt-5 space-y-5">
        {items.map(
          (item) => (
            <div
              key={item.label}
              className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0"
            >
              <p className="text-xs uppercase tracking-[0.15em] text-[#555555]">
                {item.label}
              </p>

              <p className="mt-2 text-sm leading-6 text-[#A6A6A6]">
                {item.value}
              </p>
            </div>
          )
        )}
      </div>
    </article>
  );
}

function NextPlatformStage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-dashed border-[#D9FF00]/30 bg-[#D9FF00]/[0.04] p-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9FF00]">
        Desarrollo conectado
      </p>

      <h3 className="mt-3 text-2xl font-bold">
        {title}
      </h3>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#A6A6A6]">
        {description}
      </p>
    </article>
  );
}

function SectionEyebrow({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
      {children}
    </p>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111111] p-4 text-center">
      <p className="text-3xl font-bold text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#777777]">
        {label}
      </p>
    </article>
  );
}

function StatusPill({
  value,
  accent = false,
}: {
  value: string;
  accent?: boolean;
}) {
  return (
    <span
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-semibold',
        accent
          ? 'border-[#D9FF00]/30 bg-[#D9FF00]/10 text-[#D9FF00]'
          : 'border-white/10 bg-white/[0.03] text-[#A6A6A6]',
      ].join(' ')}
    >
      {value}
    </span>
  );
}

function Avatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-16 w-16 rounded-full object-cover"
      />
    );
  }

  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join('')
      .toUpperCase();

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D9FF00] text-lg font-bold text-black">
      {initials || 'CE'}
    </div>
  );
}

function ProfileInformation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-5 border-t border-white/10 pt-5">
      <p className="text-xs uppercase tracking-[0.15em] text-[#555555]">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#A6A6A6]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-7">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#777777]">
        {description}
      </p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <p className="text-xs font-bold text-[#D9FF00]">
        {number}
      </p>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#777777]">
        {description}
      </p>
    </article>
  );
}

function getDefaultActorDescription(
  type:
    'person'
    | 'space'
    | 'funder'
): string {
  switch (type) {
    case 'person':
      return 'Tu identidad personal dentro del ecosistema creativo.';

    case 'space':
      return 'Espacio creativo representado por esta cuenta.';

    case 'funder':
      return 'Marca u organización representada por esta cuenta.';
  }
}

function getActorBadge(
  type:
    'person'
    | 'space'
    | 'funder',
  role: string
): string {
  const roleLabel =
    formatLabel(role);

  switch (type) {
    case 'person':
      return roleLabel ||
        'Persona del ecosistema';

    case 'space':
      return roleLabel ||
        'Espacio creativo';

    case 'funder':
      return roleLabel ||
        'Marca u organización';
  }
}

function formatLabel(
  value: string
): string {
  return value
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}
