'use client';

import Link from 'next/link';

import type {
  ReactNode,
} from 'react';

export interface PlatformNavigationItem {
  id: string;
  label: string;
  href?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  badge?: string;
}

interface PlatformShellProps {
  eyebrow: string;
  title: string;
  description?: string;

  entityName?: string;
  entityType?: string;
  entityHref?: string;

  navigation: PlatformNavigationItem[];

  children: ReactNode;
  actions?: ReactNode;
  sidebarFooter?: ReactNode;

  backHref?: string;
  backLabel?: string;
}

export function PlatformShell({
  eyebrow,
  title,
  description,
  entityName,
  entityType,
  entityHref,
  navigation,
  children,
  actions,
  sidebarFooter,
  backHref = '/mi-ecosistema',
  backLabel = 'Volver a Mi Ecosistema',
}: PlatformShellProps) {
  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <header className="border-b border-borde bg-superficie-elevada px-6 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              href={backHref}
              className="w-fit text-sm text-texto-largo transition hover:opacity-70"
            >
              ← {backLabel}
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-largo">
                El Culebreo
              </p>

              {entityType ? (
                <>
                  <span className="text-texto-largo">
                    /
                  </span>

                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-texto-largo">
                    {entityType}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:min-h-[calc(100vh-116px)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-borde bg-superficie-elevada px-6 py-7 lg:border-b-0 lg:border-r lg:px-7 lg:py-9">
          {entityName ? (
            <div className="border-b border-borde pb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-texto-largo">
                Identidad activa
              </p>

              <h2 className="mt-3 text-xl font-bold leading-tight">
                {entityName}
              </h2>

              {entityHref ? (
                <Link
                  href={entityHref}
                  className="mt-3 inline-flex text-xs font-semibold text-texto-largo underline transition hover:opacity-70"
                >
                  Ver perfil público →
                </Link>
              ) : null}
            </div>
          ) : null}

          <nav
            className="mt-7"
            aria-label="Navegación de plataforma"
          >
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  {item.href &&
                  !item.isDisabled ? (
                    <Link
                      href={item.href}
                      aria-current={
                        item.isActive
                          ? 'page'
                          : undefined
                      }
                      className={[
                        'flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-sm font-semibold transition',
                        item.isActive
                          ? 'border-borde bg-superficie text-texto-principal'
                          : 'border-transparent text-texto-largo hover:border-borde hover:bg-superficie',
                      ].join(' ')}
                    >
                      <span>
                        {item.label}
                      </span>

                      {item.badge ? (
                        <span className="border border-borde px-2 py-0.5 text-[10px]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <div
                      className={[
                        'flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-sm font-semibold',
                        item.isActive
                          ? 'border-borde bg-superficie text-texto-principal'
                          : 'border-transparent text-texto-largo/60',
                      ].join(' ')}
                    >
                      <span>
                        {item.label}
                      </span>

                      {item.badge ? (
                        <span className="border border-borde px-2 py-0.5 text-[10px]">
                          {item.badge}
                        </span>
                      ) : item.isDisabled ? (
                        <span className="text-[9px] uppercase tracking-[0.12em]">
                          Próximamente
                        </span>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {sidebarFooter ? (
            <div className="mt-8 border-t border-borde pt-7">
              {sidebarFooter}
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 px-6 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="mb-9">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-largo">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {title}
            </h1>

            {description ? (
              <p className="mt-4 max-w-3xl text-base leading-8 text-texto-largo">
                {description}
              </p>
            ) : null}
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
