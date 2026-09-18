'use client';

import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';

import {
  cancelVacancy,
  createVacancy,
  listInvitationsForVacancy,
  listVacanciesForProject,
} from '@/services/projects/vacancyService';
import type { ProjectVacancy, ProjectVacancyInvitation } from '@/services/projects/vacancyService';

import { VacancyCard } from './VacancyCard';

const PERSON_ROLES = [
  ['artist', 'Artista'],
  ['producer', 'Productor/a'],
  ['manager', 'Gestor/a'],
  ['cultural_manager', 'Gestor/a cultural'],
  ['designer', 'Diseñador/a'],
  ['journalist', 'Periodista'],
  ['photographer', 'Fotógrafo/a'],
  ['videographer', 'Realizador/a audiovisual'],
  ['curator', 'Curador/a'],
  ['researcher', 'Investigador/a'],
  ['educator', 'Educador/a'],
  ['volunteer', 'Voluntario/a'],
  ['space_manager', 'Gestor/a de espacio'],
  ['funder_representative', 'Representante de financiador'],
  ['brand_representative', 'Representante de marca'],
  ['organization_member', 'Miembro de organización'],
] as const;

interface VacancyManagerProps {
  projectId: string;
}

/**
 * Panel del creador del proyecto: listar/crear/cerrar vacantes y ver
 * candidatos sugeridos por rol (Paso 3 del diseño aprobado, migración
 * 060). Vive en la pestaña "Proyecto" (ProjectDashboard), junto a
 * los demás paneles conectados a Supabase por projectId.
 */
export function VacancyManager({ projectId }: VacancyManagerProps) {
  const [vacancies, setVacancies] = useState<ProjectVacancy[]>([]);
  const [invitationsByVacancy, setInvitationsByVacancy] = useState<
    Record<string, ProjectVacancyInvitation[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [roleNeeded, setRoleNeeded] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const list = await listVacanciesForProject(projectId);
      setVacancies(list);

      const invitationEntries = await Promise.all(
        list.map(async (vacancy) => [vacancy.id, await listInvitationsForVacancy(vacancy.id)] as const)
      );
      setInvitationsByVacancy(Object.fromEntries(invitationEntries));
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'No fue posible cargar las vacantes.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleCreate() {
    if (!title.trim()) {
      setError('La vacante necesita un título.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await createVacancy({
        projectId,
        title: title.trim(),
        roleNeeded: roleNeeded || undefined,
        description: description.trim() || undefined,
      });

      setTitle('');
      setRoleNeeded('');
      setDescription('');
      await refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'No fue posible crear la vacante.'
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel(vacancyId: string) {
    try {
      await cancelVacancy(vacancyId);
      await refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'No fue posible cancelar la vacante.'
      );
    }
  }

  return (
    <section className="rounded-3xl border border-borde bg-superficie-elevada p-7">
      <div className="flex items-start gap-3">
        <UserPlus className="mt-1 text-texto-principal" size={22} />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">
            Equipo y vacantes
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            ¿Quién falta en este proyecto?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-texto-largo">
            Abre una vacante puntual y El Culebreo sugiere personas
            publicadas con ese rol. Al aceptar, quedan registradas
            como parte del proyecto.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-borde bg-superficie p-5 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título de la vacante (ej. Productor de campo)"
          className="rounded-xl border border-borde bg-superficie-elevada px-3 py-2.5 text-sm text-texto-largo outline-none focus:border-rojo-base"
        />

        <select
          value={roleNeeded}
          onChange={(event) => setRoleNeeded(event.target.value)}
          className="rounded-xl border border-borde bg-superficie-elevada px-3 py-2.5 text-sm text-texto-largo outline-none focus:border-rojo-base"
        >
          <option value="">Sin rol específico</option>
          {PERSON_ROLES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={creating}
          onClick={() => void handleCreate()}
          className="rounded-full bg-rojo-base px-5 py-2.5 text-sm font-bold text-hueso disabled:opacity-50"
        >
          {creating ? 'Creando…' : 'Abrir vacante'}
        </button>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descripción (opcional)"
          rows={2}
          className="resize-none rounded-xl border border-borde bg-superficie-elevada px-3 py-2.5 text-sm text-texto-largo outline-none focus:border-rojo-base md:col-span-3"
        />
      </div>

      {error && <p className="mt-4 text-sm text-rojo-base">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-texto-largo">Cargando vacantes…</p>
        ) : vacancies.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-borde p-6 text-sm text-texto-largo">
            Todavía no hay vacantes abiertas en este proyecto.
          </p>
        ) : (
          vacancies.map((vacancy) => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              invitations={invitationsByVacancy[vacancy.id] ?? []}
              onCancel={() => void handleCancel(vacancy.id)}
              onInvited={() => void refresh()}
            />
          ))
        )}
      </div>
    </section>
  );
}
