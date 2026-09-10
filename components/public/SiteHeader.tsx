import Link from 'next/link';

import { Logo } from '../brand/Logo';
import { ThemeToggle } from '../theme/ThemeToggle';

interface SiteHeaderLink {
  label: string;
  href: string;
}

interface SiteHeaderProps {
  links?: SiteHeaderLink[];
  ctaLabel?: string;
  ctaHref?: string;
  backLabel?: string;
  backHref?: string;
  /** Poner en false en páginas donde no aplican (ej. login, registro). */
  showAuthLinks?: boolean;
  loginLabel?: string;
  loginHref?: string;
  studioLabel?: string;
  studioHref?: string;
}

const defaultLinks: SiteHeaderLink[] = [
  { label: 'Medio', href: '/' },
  { label: 'Calendario', href: '/agenda' },
  { label: 'Ecosistema', href: '/ecosistema' },
  { label: 'Proyectos', href: '/proyectos' },
];

export function SiteHeader({
  links = defaultLinks,
  ctaLabel = 'Crear un proyecto',
  ctaHref = '/studio?new=1',
  backLabel,
  backHref,
  showAuthLinks = true,
  loginLabel = 'Iniciar sesión',
  loginHref = '/login',
  studioLabel = 'Mi estudio',
  studioHref = '/studio',
}: SiteHeaderProps) {
  return (
    <header className="border-b border-borde bg-superficie">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          {backHref ? (
            <Link
              href={backHref}
              className="text-sm text-texto-largo transition hover:text-texto-principal"
            >
              ← {backLabel ?? 'Volver'}
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-3">
              <Logo size={40} />
              <span className="font-grotesk text-lg font-bold uppercase tracking-tight text-texto-principal">
                El Culebreo
              </span>
            </Link>
          )}

          <nav className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.08em] text-texto-largo md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-texto-principal">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {showAuthLinks ? (
            <>
              <Link
                href={loginHref}
                className="hidden text-sm font-semibold uppercase tracking-[0.04em] text-texto-largo transition hover:text-texto-principal sm:inline-flex"
              >
                {loginLabel}
              </Link>

              <Link
                href={studioHref}
                className="hidden border border-borde px-5 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-texto-principal transition hover:bg-superficie-elevada sm:inline-flex"
              >
                {studioLabel}
              </Link>
            </>
          ) : null}

          <Link
            href={ctaHref}
            className="border border-borde bg-rojo-base px-5 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-hueso transition hover:shadow-stencil"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
