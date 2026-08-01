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
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-[#080808] px-6 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              href={backHref}
              className="w-fit text-sm text-[#777777] transition hover:text-white"
            >
              ← {backLabel}
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                Cultura Esta
              </p>

              {entityType ? (
                <>
                  <span className="text-[#333333]">
                    /
                  </span>

                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777777]">
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
        <aside className="border-b border-white/10 bg-[#080808] px-6 py-7 lg:border-b-0 lg:border-r lg:px-7 lg:py-9">
          {entityName ? (
            <div className="border-b border-white/10 pb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#666666]">
                Identidad activa
              </p>

              <h2 className="mt-3 text-xl font-bold leading-tight">
                {entityName}
              </h2>

              {entityHref ? (
                <Link
                  href={entityHref}
                  className="mt-3 inline-flex text-xs font-semibold text-[#D9FF00] transition hover:text-white"
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
                        'flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                        item.isActive
                          ? 'border-[#D9FF00]/30 bg-[#D9FF00]/10 text-[#D9FF00]'
                          : 'border-transparent text-[#888888] hover:border-white/10 hover:bg-white/[0.03] hover:text-white',
                      ].join(' ')}
                    >
                      <span>
                        {item.label}
                      </span>

                      {item.badge ? (
                        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <div
                      className={[
                        'flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold',
                        item.isActive
                          ? 'border-[#D9FF00]/30 bg-[#D9FF00]/10 text-[#D9FF00]'
                          : 'border-transparent text-[#4F4F4F]',
                      ].join(' ')}
                    >
                      <span>
                        {item.label}
                      </span>

                      {item.badge ? (
                        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px]">
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
            <div className="mt-8 border-t border-white/10 pt-7">
              {sidebarFooter}
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 px-6 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="mb-9">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {title}
            </h1>

            {description ? (
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#999999]">
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