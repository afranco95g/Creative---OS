'use client';

import Link from 'next/link';

import {
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { CheckCircle2, Pencil, Sparkles, X } from 'lucide-react';
import { updateMyPersonProfile, PERSON_SKILLS, type PersonProfileInput } from '../services/ecosystem/personProfileService';

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
  websiteUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  publicEmail: string | null;
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
    <main className="min-h-screen bg-superficie text-texto-largo">
      <WorkspaceActorBridge
        person={person}
        spaces={spaces}
        funders={funders}
      />
      <header className="border-b border-borde/10 bg-superficie-elevada px-6 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="text-sm text-texto-largo transition hover:text-texto-largo"
              >
                ← Volver al medio
              </Link>

              <span className="text-borde">
                /
              </span>

              <Link
                href="/studio"
                className="text-sm text-texto-largo transition hover:text-texto-largo"
              >
                Creative OS
              </Link>
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-texto-principal">
              El Culebreo
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
                  className="rounded-full border border-acento/30 px-5 py-3 text-sm font-semibold text-texto-principal transition hover:bg-rojo-base hover:text-hueso"
                >
                  Revisar actores
                </Link>

                <Link
                  href="/revision-ecosistema"
                  className="rounded-full border border-acento/30 px-5 py-3 text-sm font-semibold text-texto-principal transition hover:bg-rojo-base hover:text-hueso"
                >
                  Revisar elegibilidad
                </Link>
              </>
            ) : null}

            {canReviewEditorial ? (
              <Link
                href="/revision-editorial"
                className="rounded-full border border-acento/30 px-5 py-3 text-sm font-semibold text-texto-principal transition hover:bg-rojo-base hover:text-hueso"
              >
                Revisión editorial
              </Link>
            ) : null}

            <Link
              href="/ecosistema"
              className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold transition hover:border-borde"
            >
              Explorar actores
            </Link>

            <Link
              href="/oportunidades"
              className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold transition hover:border-borde"
            >
              Financiación abierta
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-base"
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
    <section className="rounded-[36px] border border-borde/10 bg-superficie-elevada p-7 md:p-9">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <SectionEyebrow>
            Cuenta activa
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">
            {profile.fullName}
          </h2>

          <p className="mt-3 text-texto-largo">
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
  person: initialPerson,
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
  const [person, setPerson] = useState(initialPerson);
  const [editing, setEditing] = useState(false);
  const completeness = getProfileCompleteness(person);
  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
          <SectionEyebrow>
            Plataforma personal
          </SectionEyebrow>

          <div className="mt-3 flex items-center justify-between gap-4"><h2 className="text-2xl font-bold">Mi perfil</h2>{person ? <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-borde/15 px-4 py-2 text-sm font-semibold transition hover:border-acento hover:text-acento"><Pencil size={15}/> Editar perfil</button> : null}</div>

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

                  <p className="mt-1 text-sm text-texto-largo">
                    {person.headline ||
                      'Perfil creativo en construcción'}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-texto-largo">
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
              <div className="mt-7 rounded-2xl border border-borde/10 bg-black/40 p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-texto-largo">Activación del perfil</p><p className="mt-2 text-sm text-texto-largo">Completa la información esencial para enviar tu perfil a revisión.</p></div><strong className="text-2xl text-texto-principal">{completeness}%</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-borde/10"><div className="h-full rounded-full bg-rojo-base transition-all" style={{width:`${completeness}%`}}/></div></div>
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

      {editing && person ? <PersonProfileEditor person={person} onClose={() => setEditing(false)} onSaved={(updated) => { setPerson(updated); setEditing(false); }} /> : null}

      <PublicationProcess />
    </>
  );
}

const PERSON_ROLES = [['artist','Artista'],['producer','Productor/a'],['manager','Gestor/a'],['designer','Diseñador/a'],['journalist','Periodista'],['photographer','Fotógrafo/a'],['videographer','Realizador/a audiovisual'],['educator','Educador/a'],['volunteer','Voluntario/a'],['organization_member','Miembro de organización']] as const;

function PersonProfileEditor({person,onClose,onSaved}:{person:MyEcosystemPerson;onClose:()=>void;onSaved:(person:MyEcosystemPerson)=>void}){
  const [form,setForm]=useState<PersonProfileInput>({fullName:person.fullName,headline:person.headline??'',biography:person.biography??'',avatarUrl:person.avatarUrl??'',city:person.city??'',department:person.department??'',country:person.country??'Colombia',roles:person.roles,skills:person.skills,interests:person.interests,websiteUrl:person.websiteUrl??'',instagramUrl:person.instagramUrl??'',youtubeUrl:person.youtubeUrl??'',linkedinUrl:person.linkedinUrl??'',publicEmail:person.publicEmail??''});
  
  const [interestsText,setInterestsText]=useState(person.interests.join(', '));
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const preview={...person,...form,skills:form.skills,interests:splitTags(interestsText)};
  const completeness=getProfileCompleteness(preview);
  const field=<K extends keyof PersonProfileInput>(key:K,value:PersonProfileInput[K])=>setForm((current)=>({...current,[key]:value}));
  const save=async(submitForReview:boolean)=>{setError('');if(!form.fullName.trim()){setError('El nombre es obligatorio.');return}if(submitForReview&&completeness<80){setError('Completa al menos el 80% del perfil antes de enviarlo a revisión.');return}setSaving(true);try{const data=await updateMyPersonProfile(person.id,{...form,skills:form.skills,interests:splitTags(interestsText)},submitForReview);onSaved(mapUpdatedPerson(person,data))}catch(cause){setError(cause instanceof Error?cause.message:'No fue posible guardar el perfil.')}finally{setSaving(false)}};
  return <div role="dialog" aria-modal="true" aria-label="Editar perfil" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"><section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-borde/15 bg-superficie-elevada"><header className="flex items-center justify-between border-b border-borde/10 px-6 py-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-texto-principal">Plataforma personal</p><h2 className="mt-2 text-2xl font-bold">Editar y activar mi perfil</h2></div><button onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full border border-borde/15"><X size={18}/></button></header><div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr_320px]"><form onSubmit={(event)=>{event.preventDefault();void save(false)}} className="space-y-8 p-6 sm:p-8"><EditorSection title="Identidad profesional"><div className="grid gap-5 sm:grid-cols-2"><TextField label="Nombre completo" value={form.fullName} onChange={(v)=>field('fullName',v)} required/><TextField label="Titular profesional" value={form.headline} onChange={(v)=>field('headline',v)} placeholder="Ej. Productora y gestora cultural"/><TextField label="URL de fotografía" value={form.avatarUrl} onChange={(v)=>field('avatarUrl',v)} placeholder="https://..."/><TextField label="Correo público" value={form.publicEmail} onChange={(v)=>field('publicEmail',v)} type="email"/></div><label className="block"><EditorLabel>Biografía</EditorLabel><textarea value={form.biography} onChange={(e)=>field('biography',e.target.value)} maxLength={1200} placeholder="Cuenta tu trayectoria, enfoque creativo y el tipo de proyectos que desarrollas." className="mt-2 min-h-36 w-full rounded-2xl border border-borde/15 bg-superficie-elevada p-4 outline-none focus:border-acento"/><span className="mt-1 block text-right text-xs text-texto-largo">{form.biography.length}/1200</span></label></EditorSection><EditorSection title="Ubicación"><div className="grid gap-5 sm:grid-cols-3"><TextField label="Ciudad" value={form.city} onChange={(v)=>field('city',v)}/><TextField label="Departamento" value={form.department} onChange={(v)=>field('department',v)}/><TextField label="País" value={form.country} onChange={(v)=>field('country',v)}/></div></EditorSection><EditorSection title="Roles y capacidades"><div><EditorLabel>Roles creativos</EditorLabel><div className="mt-3 flex flex-wrap gap-2">{PERSON_ROLES.map(([id,label])=>{const active=form.roles.includes(id);return <button key={id} type="button" onClick={()=>field('roles',active?form.roles.filter((role)=>role!==id):[...form.roles,id])} className={`rounded-full border px-4 py-2 text-sm ${active?'border-acento bg-rojo-base font-semibold text-hueso':'border-borde/15 text-texto-largo'}`}>{label}</button>})}</div></div><div><EditorLabel>Habilidades</EditorLabel><div className="mt-3 flex flex-wrap gap-2">{PERSON_SKILLS.map(([id,label])=>{const active=form.skills.includes(id);return <button key={id} type="button" onClick={()=>field('skills',active?form.skills.filter((skill)=>skill!==id):[...form.skills,id])} className={`rounded-full border px-4 py-2 text-sm ${active?'border-acento bg-rojo-base font-semibold text-hueso':'border-borde/15 text-texto-largo'}`}>{label}</button>})}</div></div><TagField label="Intereses" value={interestsText} onChange={setInterestsText} placeholder="Música, territorio, educación..."/></EditorSection><EditorSection title="Enlaces"><div className="grid gap-5 sm:grid-cols-2"><TextField label="Sitio web" value={form.websiteUrl} onChange={(v)=>field('websiteUrl',v)} placeholder="https://..."/><TextField label="Instagram" value={form.instagramUrl} onChange={(v)=>field('instagramUrl',v)} placeholder="https://instagram.com/..."/><TextField label="LinkedIn" value={form.linkedinUrl} onChange={(v)=>field('linkedinUrl',v)} placeholder="https://linkedin.com/in/..."/><TextField label="YouTube" value={form.youtubeUrl} onChange={(v)=>field('youtubeUrl',v)} placeholder="https://youtube.com/@..."/></div></EditorSection>{error?<p className="rounded-2xl border border-borde bg-rojo-base p-4 text-sm text-hueso">{error}</p>:null}<div className="flex flex-wrap justify-end gap-3 border-t border-borde/10 pt-6"><button type="button" onClick={onClose} className="rounded-full border border-borde/15 px-5 py-3">Cancelar</button><button disabled={saving} className="rounded-full border border-acento/40 px-5 py-3 font-semibold text-texto-principal disabled:opacity-50">Guardar borrador</button><button type="button" disabled={saving||completeness<80||person.status==='review'} onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-5 py-3 font-bold text-hueso disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={17}/>{person.status==='review'?'En revisión':'Enviar para activar'}</button></div></form><aside className="border-t border-borde/10 bg-black/30 p-6 lg:border-l lg:border-t-0 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-texto-largo">Progreso del perfil</p><strong className="mt-3 block text-5xl text-texto-principal">{completeness}%</strong><div className="mt-4 h-2 overflow-hidden rounded-full bg-borde/10"><div className="h-full bg-rojo-base" style={{width:`${completeness}%`}}/></div><p className="mt-4 text-sm leading-6 text-texto-largo">Necesitas 80% para solicitar la activación pública.</p><div className="mt-8 space-y-3">{profileChecklist(preview).map((item)=><div key={item.label} className="flex items-center gap-3 text-sm"><CheckCircle2 size={17} className={item.complete?'text-texto-principal':'text-texto-largo'}/><span className={item.complete?'text-texto-largo':'text-texto-largo'}>{item.label}</span></div>)}</div></aside></div></section></div>;
}

function EditorSection({title,children}:{title:string;children:React.ReactNode}){return <section><h3 className="mb-5 text-lg font-semibold">{title}</h3><div className="space-y-5">{children}</div></section>}
function EditorLabel({children}:{children:React.ReactNode}){return <span className="text-xs font-bold uppercase tracking-[.16em] text-texto-largo">{children}</span>}
function TextField({label,value,onChange,placeholder,type='text',required=false}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string;type?:string;required?:boolean}){return <label className="block"><EditorLabel>{label}</EditorLabel><input type={type} required={required} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-borde/15 bg-superficie-elevada px-4 py-3 outline-none focus:border-acento"/></label>}
function TagField({label,value,onChange,placeholder}:{label:string;value:string;onChange:(value:string)=>void;placeholder:string}){const tags=splitTags(value);return <label className="block"><EditorLabel>{label}</EditorLabel><input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-borde/15 bg-superficie-elevada px-4 py-3 outline-none focus:border-acento"/><span className="mt-2 block text-xs text-texto-largo">Separa cada elemento con una coma.</span>{tags.length?<div className="mt-3 flex flex-wrap gap-2">{tags.map((tag)=><span key={tag} className="rounded-full border border-borde/10 bg-borde/5 px-3 py-1 text-xs text-texto-largo">{tag}</span>)}</div>:null}</label>}
function splitTags(value:string){return [...new Set(value.split(',').map((item)=>item.trim()).filter(Boolean))]}
function profileChecklist(person:MyEcosystemPerson){return [{label:'Nombre y titular profesional',complete:Boolean(person.fullName&&person.headline)},{label:'Biografía',complete:Boolean(person.biography&&person.biography.length>=80)},{label:'Ubicación',complete:Boolean(person.city&&person.country)},{label:'Rol creativo',complete:person.roles.length>0},{label:'Habilidades',complete:person.skills.length>=2},{label:'Intereses',complete:person.interests.length>=2},{label:'Fotografía o avatar',complete:Boolean(person.avatarUrl)},{label:'Canal de contacto',complete:Boolean(person.publicEmail||person.websiteUrl||person.instagramUrl)}]}
function getProfileCompleteness(person:MyEcosystemPerson|null){if(!person)return 0;const items=profileChecklist(person);return Math.round(items.filter((item)=>item.complete).length/items.length*100)}
interface UpdatedPersonRow { full_name:string; headline:string|null; biography:string|null; avatar_url:string|null; city:string|null; department:string|null; country:string|null; roles:string[]|null; skills:string[]|null; interests:string[]|null; website_url:string|null; instagram_url:string|null; youtube_url:string|null; linkedin_url:string|null; public_email:string|null; verified:boolean|null; featured:boolean|null; status:string }
function mapUpdatedPerson(previous:MyEcosystemPerson,row:UpdatedPersonRow):MyEcosystemPerson{return{...previous,fullName:row.full_name,headline:row.headline,biography:row.biography,avatarUrl:row.avatar_url,city:row.city,department:row.department,country:row.country,roles:row.roles??[],skills:row.skills??[],interests:row.interests??[],websiteUrl:row.website_url,instagramUrl:row.instagram_url,youtubeUrl:row.youtube_url,linkedinUrl:row.linkedin_url,publicEmail:row.public_email,verified:Boolean(row.verified),featured:Boolean(row.featured),status:row.status}}

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
    <article className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
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
          className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso"
        >
          Nuevo proyecto
        </Link>
      </div>

      <ProjectCloudPanel />

      <section className="mt-6">
        <p className="text-sm font-semibold text-texto-largo">¿Qué quieres hacer?</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ProjectEntry href="/studio?new=1" title="Crear una idea" description="Empieza desde una intuición y desarróllala con Creative OS." />
          <ProjectEntry href="/importar-proyecto" title="Importar un proyecto" description="Carga información existente para que el Productor Ejecutivo proponga un plan." />
          <ProjectEntry href="/aplicar" title="Aplicar al ecosistema" description="Presenta un proyecto consolidado que busca conexiones, agenda, aliados o acompañamiento." />
        </div>
      </section>

      {!workspaceState ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-superficie" />
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
                className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5 transition hover:border-acento"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-texto-largo">
                  {categoryLabels[
                    project.category
                  ] ??
                    project.category}
                </p>

                <h3 className="mt-3 text-xl font-semibold">
                  {project.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-texto-largo">
                  {project.description ||
                    'Proyecto sin descripción inicial.'}
                </p>

                <p className="mt-5 text-sm font-semibold text-texto-principal">
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

function ProjectEntry({href,title,description}:{href:string;title:string;description:string}){return <Link href={href} className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5 transition hover:border-acento"><strong>{title}</strong><p className="mt-2 text-sm leading-6 text-texto-largo">{description}</p></Link>}

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
      <article className="rounded-[36px] border border-borde/10 bg-superficie-elevada p-7 md:p-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <SectionEyebrow>
              Plataforma de espacio
            </SectionEyebrow>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">
              {space.name}
            </h2>

            <p className="mt-4 text-sm leading-7 text-texto-largo">
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
              className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso"
            >
              Gestionar experiencias
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold transition hover:border-borde"
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
      <article className="rounded-[36px] border border-borde/10 bg-superficie-elevada p-7 md:p-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <SectionEyebrow>
              Plataforma de marca
            </SectionEyebrow>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">
              {funder.name}
            </h2>

            <p className="mt-4 text-sm leading-7 text-texto-largo">
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
              className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso"
            >
              Gestionar oportunidades
            </Link>

            <Link
              href="/ecosistema"
              className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold transition hover:border-borde"
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
        className="inline-flex bg-rojo-base px-5 py-3 text-sm font-bold text-hueso"
      >
        Gestionar productos
      </Link>
    </section>
  );
}

function PublicationProcess() {
  return (
    <section className="rounded-[36px] border border-borde/10 bg-superficie-elevada p-7 md:p-9">
      <SectionEyebrow>
        Publicación
      </SectionEyebrow>

      <h2 className="mt-3 text-3xl font-bold">
        Cómo llegará un proyecto al medio
      </h2>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-texto-largo">
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
          description="Aparece en El Culebreo."
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
    <section className="rounded-3xl border border-borde bg-superficie-elevada p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-naranja">
        Información incompleta
      </p>

      <div className="mt-3 space-y-2">
        {warnings.map(
          (warning) => (
            <p
              key={warning}
              className="text-sm leading-6 text-texto-largo"
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
    <article className="rounded-3xl border border-borde/10 bg-superficie-elevada p-6">
      <h3 className="text-xl font-bold">
        {title}
      </h3>

      <div className="mt-5 space-y-5">
        {items.map(
          (item) => (
            <div
              key={item.label}
              className="border-t border-borde/10 pt-5 first:border-t-0 first:pt-0"
            >
              <p className="text-xs uppercase tracking-[0.15em] text-texto-largo">
                {item.label}
              </p>

              <p className="mt-2 text-sm leading-6 text-texto-largo">
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
    <article className="rounded-3xl border border-dashed border-acento/30 bg-rojo-base/[0.04] p-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-texto-principal">
        Desarrollo conectado
      </p>

      <h3 className="mt-3 text-2xl font-bold">
        {title}
      </h3>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-texto-largo">
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
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
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
    <article className="rounded-2xl border border-borde/10 bg-superficie-elevada p-4 text-center">
      <p className="text-3xl font-bold text-texto-principal">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-texto-largo">
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
          ? 'border-acento/30 bg-acento/10 text-texto-principal'
          : 'border-borde/10 bg-superficie-elevada text-texto-largo',
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
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rojo-base text-lg font-bold text-hueso">
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
    <div className="mt-5 border-t border-borde/10 pt-5">
      <p className="text-xs uppercase tracking-[0.15em] text-texto-largo">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-texto-largo">
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
    <div className="mt-6 rounded-3xl border border-dashed border-borde/15 bg-superficie-elevada p-7">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-texto-largo">
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
    <article className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5">
      <p className="text-xs font-bold text-texto-principal">
        {number}
      </p>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-texto-largo">
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
