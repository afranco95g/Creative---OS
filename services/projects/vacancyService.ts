import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export type VacancyStatus = 'open' | 'filled' | 'cancelled';
export type InvitationStatus = 'suggested' | 'invited' | 'accepted' | 'declined';

export interface ProjectVacancy {
  id: string;
  projectId: string;
  title: string;
  roleNeeded: string | null;
  description: string;
  status: VacancyStatus;
  filledByPersonId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectVacancyRow {
  id: string;
  project_id: string;
  title: string;
  role_needed: string | null;
  description: string;
  status: VacancyStatus;
  filled_by_person_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const VACANCY_COLUMNS =
  'id, project_id, title, role_needed, description, status, filled_by_person_id, created_by, created_at, updated_at';

function mapVacancyRow(row: ProjectVacancyRow): ProjectVacancy {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    roleNeeded: row.role_needed,
    description: row.description,
    status: row.status,
    filledByPersonId: row.filled_by_person_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ProjectVacancyInvitation {
  id: string;
  vacancyId: string;
  candidatePersonId: string;
  status: InvitationStatus;
  invitedBy: string | null;
  createdAt: string;
  respondedAt: string | null;
}

interface ProjectVacancyInvitationRow {
  id: string;
  vacancy_id: string;
  candidate_person_id: string;
  status: InvitationStatus;
  invited_by: string | null;
  created_at: string;
  responded_at: string | null;
}

const INVITATION_COLUMNS =
  'id, vacancy_id, candidate_person_id, status, invited_by, created_at, responded_at';

function mapInvitationRow(row: ProjectVacancyInvitationRow): ProjectVacancyInvitation {
  return {
    id: row.id,
    vacancyId: row.vacancy_id,
    candidatePersonId: row.candidate_person_id,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

const createVacancySchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, 'La vacante necesita un título.'),
  roleNeeded: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
});

export type CreateVacancyInput = z.infer<typeof createVacancySchema>;

/** Vacantes de un proyecto, para quien lo administra. */
export async function listVacanciesForProject(projectId: string): Promise<ProjectVacancy[]> {
  const { data, error } = await supabase
    .from('project_vacancies')
    .select(VACANCY_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapVacancyRow(row as ProjectVacancyRow));
}

export async function createVacancy(input: CreateVacancyInput): Promise<ProjectVacancy> {
  const parsed = createVacancySchema.parse(input);

  const { data, error } = await supabase
    .from('project_vacancies')
    .insert({
      project_id: parsed.projectId,
      title: parsed.title,
      role_needed: parsed.roleNeeded ?? null,
      description: parsed.description ?? '',
    })
    .select(VACANCY_COLUMNS)
    .single();

  if (error) throw error;
  return mapVacancyRow(data as ProjectVacancyRow);
}

export async function cancelVacancy(vacancyId: string): Promise<void> {
  const { error } = await supabase
    .from('project_vacancies')
    .update({ status: 'cancelled' })
    .eq('id', vacancyId);

  if (error) throw error;
}

/** Invitaciones de una vacante, para quien administra el proyecto. */
export async function listInvitationsForVacancy(
  vacancyId: string
): Promise<ProjectVacancyInvitation[]> {
  const { data, error } = await supabase
    .from('project_vacancy_invitations')
    .select(INVITATION_COLUMNS)
    .eq('vacancy_id', vacancyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapInvitationRow(row as ProjectVacancyInvitationRow));
}

/** Invita a una persona específica a cubrir una vacante. */
export async function inviteCandidateToVacancy(
  vacancyId: string,
  candidatePersonId: string
): Promise<ProjectVacancyInvitation> {
  const { data, error } = await supabase
    .from('project_vacancy_invitations')
    .insert({
      vacancy_id: vacancyId,
      candidate_person_id: candidatePersonId,
      status: 'invited',
    })
    .select(INVITATION_COLUMNS)
    .single();

  if (error) throw error;
  return mapInvitationRow(data as ProjectVacancyInvitationRow);
}

/**
 * Invitaciones recibidas por la persona con sesión iniciada — la
 * bandeja "te sugirieron para este proyecto" de su dashboard privado.
 * Trae también el título de la vacante y el proyecto, para no
 * necesitar una segunda consulta en la interfaz.
 */
export interface MyInvitation extends ProjectVacancyInvitation {
  vacancyTitle: string;
  vacancyRoleNeeded: string | null;
  projectId: string;
  projectTitle: string;
}

interface MyInvitationRow extends ProjectVacancyInvitationRow {
  project_vacancies: {
    title: string;
    role_needed: string | null;
    project_id: string;
    projects: { title: string } | null;
  } | null;
}

export async function listMyInvitations(): Promise<MyInvitation[]> {
  const { data, error } = await supabase
    .from('project_vacancy_invitations')
    .select(
      `${INVITATION_COLUMNS}, project_vacancies!inner(title, role_needed, project_id, projects(title))`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as MyInvitationRow[]).map((row) => ({
    ...mapInvitationRow(row),
    vacancyTitle: row.project_vacancies?.title ?? '',
    vacancyRoleNeeded: row.project_vacancies?.role_needed ?? null,
    projectId: row.project_vacancies?.project_id ?? '',
    projectTitle: row.project_vacancies?.projects?.title ?? '',
  }));
}

/**
 * Acepta una invitación. Requiere el consentimiento explícito de
 * habeas data (checkbox sin pre-marcar en la interfaz) — la función
 * de base de datos rechaza la operación si no viene en true. Hace,
 * en una sola transacción: marcar la invitación aceptada, llenar la
 * vacante, crear el vínculo real en project_actor_links y registrar
 * el consentimiento (migraciones 059 y 060).
 */
export async function acceptVacancyInvitation(
  invitationId: string,
  habeasDataConsentGiven: boolean
): Promise<void> {
  const { error } = await supabase.rpc('accept_vacancy_invitation', {
    target_invitation_id: invitationId,
    habeas_data_consent_given: habeasDataConsentGiven,
  });

  if (error) throw error;
}

export async function declineVacancyInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc('decline_vacancy_invitation', {
    target_invitation_id: invitationId,
  });

  if (error) throw error;
}

interface PublishedPersonRow {
  id: string;
  full_name: string;
  slug: string;
  roles: string[];
}

/**
 * Personas publicadas con un rol específico — candidatas para
 * matchPeopleToVacancy (engines/vacancyMatchingEngine.ts). Solo trae
 * personas públicas (status='published'), misma visibilidad que el
 * resto del ecosistema.
 */
export async function listPublishedPeopleByRole(role: string): Promise<
  Array<{ id: string; fullName: string; slug: string; roles: string[] }>
> {
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, slug, roles')
    .eq('status', 'published')
    .contains('roles', [role]);

  if (error) throw error;

  return ((data ?? []) as PublishedPersonRow[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    slug: row.slug,
    roles: row.roles,
  }));
}
