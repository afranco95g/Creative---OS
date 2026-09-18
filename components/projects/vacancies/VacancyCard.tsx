'use client';

import type { ProjectVacancy, ProjectVacancyInvitation } from '@/services/projects/vacancyService';
import { SuggestedCandidatesList } from './SuggestedCandidatesList';

const ROLE_LABELS: Record<string, string> = {
  artist: 'Artista',
  producer: 'Productor/a',
  manager: 'Gestor/a',
  cultural_manager: 'Gestor/a cultural',
  designer: 'Diseñador/a',
  journalist: 'Periodista',
  photographer: 'Fotógrafo/a',
  videographer: 'Realizador/a audiovisual',
  curator: 'Curador/a',
  researcher: 'Investigador/a',
  educator: 'Educador/a',
  volunteer: 'Voluntario/a',
  space_manager: 'Gestor/a de espacio',
  funder_representative: 'Representante de financiador',
  brand_representative: 'Representante de marca',
  organization_member: 'Miembro de organización',
};

const STATUS_LABELS: Record<ProjectVacancy['status'], string> = {
  open: 'Abierta',
  filled: 'Cubierta',
  cancelled: 'Cancelada',
};

interface VacancyCardProps {
  vacancy: ProjectVacancy;
  invitations: ProjectVacancyInvitation[];
  onCancel: () => void;
  onInvited: () => void;
}

export function VacancyCard({
  vacancy,
  invitations,
  onCancel,
  onInvited,
}: VacancyCardProps) {
  const alreadyInvitedIds = new Set(invitations.map((invitation) => invitation.candidatePersonId));

  return (
    <article className="rounded-2xl border border-borde bg-superficie p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-texto-largo">{vacancy.title}</p>
          {vacancy.roleNeeded && (
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-texto-largo">
              {ROLE_LABELS[vacancy.roleNeeded] ?? vacancy.roleNeeded}
            </p>
          )}
          {vacancy.description && (
            <p className="mt-2 text-sm leading-relaxed text-texto-largo">
              {vacancy.description}
            </p>
          )}
        </div>

        <span className="shrink-0 rounded-full border border-borde px-3 py-1 text-[10px] uppercase text-texto-largo">
          {STATUS_LABELS[vacancy.status]}
        </span>
      </div>

      {invitations.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-texto-largo">
            Invitaciones enviadas
          </p>
          {invitations.map((invitation) => (
            <p key={invitation.id} className="text-sm text-texto-largo">
              {invitation.status === 'invited' && 'Esperando respuesta'}
              {invitation.status === 'accepted' && 'Aceptada ✓'}
              {invitation.status === 'declined' && 'Rechazada'}
            </p>
          ))}
        </div>
      )}

      {vacancy.status === 'open' && (
        <>
          <SuggestedCandidatesList
            roleNeeded={vacancy.roleNeeded}
            vacancyId={vacancy.id}
            excludePersonIds={alreadyInvitedIds}
            onInvited={onInvited}
          />

          <button
            type="button"
            onClick={onCancel}
            className="mt-4 text-xs text-texto-largo transition hover:text-rojo-base"
          >
            Cancelar vacante
          </button>
        </>
      )}
    </article>
  );
}
