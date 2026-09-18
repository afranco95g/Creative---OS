'use client';

import { useEffect, useState } from 'react';

import { matchPeopleToVacancy } from '@/engines/vacancyMatchingEngine';
import {
  inviteCandidateToVacancy,
  listPublishedPeopleByRole,
} from '@/services/projects/vacancyService';

interface SuggestedCandidatesListProps {
  vacancyId: string;
  roleNeeded: string | null;
  excludePersonIds: Set<string>;
  onInvited: () => void;
}

/**
 * Trae personas publicadas con el rol de la vacante y aplica
 * matchPeopleToVacancy (engines/vacancyMatchingEngine.ts) — la
 * función solo filtra, la búsqueda real ya llega acotada por rol
 * desde Supabase para no traer todo el directorio de personas.
 */
export function SuggestedCandidatesList({
  vacancyId,
  roleNeeded,
  excludePersonIds,
  onInvited,
}: SuggestedCandidatesListProps) {
  const [candidates, setCandidates] = useState<
    Array<{ personId: string; fullName: string; slug: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roleNeeded) {
      setCandidates([]);
      return;
    }

    setLoading(true);
    setError('');

    listPublishedPeopleByRole(roleNeeded)
      .then((people) => {
        setCandidates(matchPeopleToVacancy(roleNeeded, people));
      })
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'No fue posible buscar personas con este rol.'
        );
      })
      .finally(() => setLoading(false));
  }, [roleNeeded]);

  async function handleInvite(personId: string) {
    setInvitingId(personId);
    setError('');

    try {
      await inviteCandidateToVacancy(vacancyId, personId);
      onInvited();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'No fue posible enviar la invitación.'
      );
    } finally {
      setInvitingId(null);
    }
  }

  if (!roleNeeded) {
    return (
      <p className="mt-4 text-sm text-texto-largo">
        Esta vacante no tiene un rol asociado — no hay sugerencia
        automática, busca directamente en el ecosistema.
      </p>
    );
  }

  const visibleCandidates = candidates.filter(
    (candidate) => !excludePersonIds.has(candidate.personId)
  );

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.14em] text-texto-largo">
        Candidatos sugeridos
      </p>

      {loading ? (
        <p className="mt-2 text-sm text-texto-largo">Buscando…</p>
      ) : error ? (
        <p className="mt-2 text-sm text-rojo-base">{error}</p>
      ) : visibleCandidates.length === 0 ? (
        <p className="mt-2 text-sm text-texto-largo">
          No hay personas publicadas con este rol todavía.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleCandidates.map((candidate) => (
            <button
              key={candidate.personId}
              type="button"
              disabled={invitingId === candidate.personId}
              onClick={() => void handleInvite(candidate.personId)}
              className="flex items-center gap-2 rounded-full border border-borde px-4 py-2 text-sm text-texto-largo transition hover:border-rojo-base hover:text-rojo-base disabled:opacity-50"
            >
              {candidate.fullName}
              <span className="text-xs uppercase text-texto-principal">
                {invitingId === candidate.personId ? 'Invitando…' : 'Invitar'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
