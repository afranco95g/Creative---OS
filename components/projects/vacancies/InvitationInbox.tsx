'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

import {
  acceptVacancyInvitation,
  declineVacancyInvitation,
  listMyInvitations,
} from '@/services/projects/vacancyService';
import type { MyInvitation } from '@/services/projects/vacancyService';

/**
 * Bandeja "te sugirieron para este proyecto" dentro del dashboard
 * privado de la persona (decisión de Andrés, 2026-09-18: vive aquí,
 * no en una sección nueva de navegación). Solo se muestra para
 * actores tipo persona — una invitación siempre apunta a
 * candidate_person_id.
 *
 * El checkbox de habeas data NO viene premarcado (decisión de
 * Andrés) y el texto es un borrador neutral — pendiente de revisión
 * jurídica formal, ver migración 059.
 */
export function InvitationInbox() {
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consentByInvitation, setConsentByInvitation] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const data = await listMyInvitations();
      setInvitations(data.filter((invitation) => invitation.status === 'invited'));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'No fue posible cargar tus invitaciones.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleAccept(invitationId: string) {
    if (!consentByInvitation[invitationId]) {
      setError('Marca la casilla de autorización de datos para aceptar.');
      return;
    }

    setBusyId(invitationId);
    setError('');

    try {
      await acceptVacancyInvitation(invitationId, true);
      await refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'No fue posible aceptar la invitación.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setBusyId(invitationId);
    setError('');

    try {
      await declineVacancyInvitation(invitationId);
      await refresh();
    } catch (declineError) {
      setError(
        declineError instanceof Error
          ? declineError.message
          : 'No fue posible rechazar la invitación.'
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!loading && invitations.length === 0) return null;

  return (
    <section className="rounded-3xl border border-borde bg-superficie-elevada p-7">
      <div className="flex items-start gap-3">
        <Mail className="mt-1 text-texto-principal" size={22} />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">
            Invitaciones
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Te sugirieron para estos proyectos
          </h2>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rojo-base">{error}</p>}

      <div className="mt-6 space-y-5">
        {loading ? (
          <p className="text-sm text-texto-largo">Cargando…</p>
        ) : (
          invitations.map((invitation) => (
            <article
              key={invitation.id}
              className="rounded-2xl border border-borde bg-superficie p-5"
            >
              <p className="font-semibold text-texto-largo">
                {invitation.projectTitle}
              </p>
              <p className="mt-1 text-sm text-texto-largo">
                Vacante: {invitation.vacancyTitle}
              </p>

              <Link
                href={`/studio/projects/${invitation.projectId}`}
                className="mt-2 inline-block text-xs uppercase tracking-[0.14em] text-texto-principal hover:underline"
              >
                Ver proyecto →
              </Link>

              <label className="mt-4 flex items-start gap-3 text-sm text-texto-largo">
                <input
                  type="checkbox"
                  checked={consentByInvitation[invitation.id] ?? false}
                  onChange={(event) =>
                    setConsentByInvitation((current) => ({
                      ...current,
                      [invitation.id]: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  Autorizo el tratamiento de mis datos personales para
                  participar en este proyecto, sujeto a los términos
                  de la plataforma y a los acuerdos entre las partes.{' '}
                  <span className="text-xs text-texto-principal">
                    (Texto borrador — pendiente de revisión jurídica formal.)
                  </span>
                </span>
              </label>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={busyId === invitation.id}
                  onClick={() => void handleAccept(invitation.id)}
                  className="rounded-full bg-rojo-base px-5 py-2 text-sm font-bold text-hueso disabled:opacity-50"
                >
                  Aceptar
                </button>

                <button
                  type="button"
                  disabled={busyId === invitation.id}
                  onClick={() => void handleDecline(invitation.id)}
                  className="rounded-full border border-borde px-5 py-2 text-sm text-texto-largo transition hover:border-rojo-base hover:text-rojo-base disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>

              <p className="mt-4 text-[11px] leading-5 text-texto-largo">
                El Culebreo actúa como directorio y facilitador de
                conexión del ecosistema — no es empleador de quienes
                participan en este proyecto. La regulación de derechos
                de autor y condiciones de trabajo entre las partes se
                acuerda de forma independiente.{' '}
                <span className="text-texto-principal">
                  (Texto borrador — pendiente de revisión jurídica formal.)
                </span>
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
