'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { MUSIC_BUSINESS_PROGRAM } from './musicBusinessProgramData';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

interface QuoteContact {
  emailEnabled: boolean;
  email: string | null;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
}

interface CoursePricing {
  priceCop: number;
  paymentStructure: string | null;
}

function buildEnrollEmailHref(email: string): string {
  const subject = encodeURIComponent('Quiero inscribirme — Programa Music Business');
  return `mailto:${email}?subject=${subject}`;
}

function buildEnrollWhatsappHref(whatsappNumber: string): string {
  const digitsOnly = whatsappNumber.replace(/[^\d]/g, '');
  const message = encodeURIComponent('Hola, quiero inscribirme al Programa Music Business.');
  return `https://wa.me/${digitsOnly}?text=${message}`;
}

const totalHours = MUSIC_BUSINESS_PROGRAM.reduce((acc, m) => acc + m.estimatedHours, 0);

/**
 * Vitrina pública del curso "Music Business": la ve cualquier persona,
 * inicie sesión o no. Muestra el programa (títulos y objetivos de cada
 * módulo, nunca las lecciones ni los recursos descargables) y el precio.
 * El contenido real vive en MusicBusinessCoursePlatform, detrás de
 * MusicBusinessAccessGate -- solo lo ve el equipo de Imagine Company hoy,
 * hasta que exista un mecanismo real de compra/pago.
 */
export function MusicBusinessTeaser() {
  const [contact, setContact] = useState<QuoteContact | null>(null);
  const [pricing, setPricing] = useState<CoursePricing | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContact() {
      const { data: funder } = await supabase
        .from('funders')
        .select('id')
        .eq('public_email', 'imaginecompanysas@gmail.com')
        .maybeSingle();

      if (!funder) return;

      const { data } = await supabase
        .from('funders')
        .select(
          'quote_contact_email_enabled, quote_contact_whatsapp_enabled, quote_contact_whatsapp_number, public_email'
        )
        .eq('id', funder.id)
        .maybeSingle();

      if (!data || cancelled) return;

      setContact({
        emailEnabled: Boolean(data.quote_contact_email_enabled) && Boolean(data.public_email),
        email: data.public_email,
        whatsappEnabled:
          Boolean(data.quote_contact_whatsapp_enabled) && Boolean(data.quote_contact_whatsapp_number),
        whatsappNumber: data.quote_contact_whatsapp_number,
      });
    }

    // El precio y la forma de pago vienen de la vitrina pública de cursos
    // (course_public_teasers, migración 056) -- campo editable en la base
    // de datos, no hardcodeado. Si Imagine cambia el precio, se actualiza
    // ahí y este componente lo refleja sin tocar código.
    async function loadPricing() {
      const { data } = await supabase
        .from('course_public_teasers')
        .select('price, payment_structure')
        .eq('title', 'Music Business')
        .maybeSingle();

      if (!data || cancelled) return;

      setPricing({
        priceCop: Number(data.price),
        paymentStructure: data.payment_structure,
      });
    }

    loadContact();
    loadPricing();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section className="border border-borde bg-superficie-elevada p-8 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
          Imagine Company — Programa educativo
        </p>

        <h1 className="stencil-heading mt-5 text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl">
          Music Business
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-texto-largo">
          Un programa de estructuración para proyectos musicales: de la identidad
          artística a la industria, el negocio y la sostenibilidad del catálogo.
          {' '}
          {MUSIC_BUSINESS_PROGRAM.length} módulos · {totalHours} horas de contenido.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {pricing ? (
            <span className="border border-borde px-5 py-3 text-2xl font-black text-texto-principal">
              {formatCop(pricing.priceCop)}
            </span>
          ) : null}

          {contact?.emailEnabled ? (
            <a
              href={buildEnrollEmailHref(contact.email as string)}
              className="rounded-full bg-rojo-base px-6 py-3 font-bold text-hueso transition hover:bg-rojo-base/90"
            >
              Quiero inscribirme →
            </a>
          ) : null}

          {contact?.whatsappEnabled ? (
            <a
              href={buildEnrollWhatsappHref(contact.whatsappNumber as string)}
              className="rounded-full border border-rojo-base px-6 py-3 font-bold text-texto-principal transition hover:bg-rojo-base hover:text-hueso"
            >
              Escribir por WhatsApp
            </a>
          ) : null}

          {!contact?.emailEnabled && !contact?.whatsappEnabled ? (
            <span className="text-sm text-texto-largo">
              Inscripciones próximamente.
            </span>
          ) : null}
        </div>

        {pricing?.paymentStructure ? (
          <p className="mt-3 text-sm text-texto-largo">{pricing.paymentStructure}</p>
        ) : null}

        <p className="mt-4 text-xs text-texto-largo">
          El contenido completo (lecciones, plantillas y recursos descargables) se
          habilita después de confirmar la inscripción.
        </p>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
          Programa
        </p>

        <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em]">
          Qué vas a construir
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {MUSIC_BUSINESS_PROGRAM.map((module) => (
            <article
              key={module.id}
              className="border border-borde bg-superficie-elevada p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rojo-base/15 text-sm font-black text-texto-principal">
                  {module.number}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-texto-largo">
                  <Clock size={14} />
                  {module.estimatedHours}h
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold leading-tight text-texto-principal">
                {module.shortTitle}
              </h3>

              <p className="mt-3 text-sm leading-6 text-texto-largo">
                {module.description}
              </p>

              {module.learningObjectives.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {module.learningObjectives.slice(0, 2).map((objective) => (
                    <li
                      key={objective}
                      className="flex items-start gap-2 text-xs text-texto-largo"
                    >
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-rojo-base" />
                      {objective}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="flex items-center gap-3 border-t border-borde pt-8 text-sm text-texto-largo">
        <GraduationCap size={18} />
        Un programa de Imagine Company, aliada de El Culebreo.
      </section>
    </div>
  );
}
