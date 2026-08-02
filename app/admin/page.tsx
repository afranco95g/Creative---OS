import Link from 'next/link';
import { redirect } from 'next/navigation';

import { canAccessWorkspace } from '../../services/auth/workspace';
import LogoutButton from '../../components/admin/LogoutButton';

const modules = [
  {
    title: 'Historias',
    description:
      'Administra documentales, entrevistas, artículos, reportajes, fotohistorias y textos de opinión.',
    href: '/admin/stories',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Portada',
    description: 'Agrega, ordena, oculta y publica bloques aprobados para la portada del medio.',
    href: '/admin/homepage',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Multimedia',
    description: 'Sube y reutiliza imágenes editoriales con texto alternativo, créditos y metadatos.',
    href: '/admin/media',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Agenda',
    description:
      'Publica eventos, talleres, exhibiciones, conciertos, encuentros y actividades culturales.',
    href: '/gestion-agenda',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Convocatorias',
    description:
      'Organiza becas, residencias, estímulos, oportunidades laborales y llamados abiertos.',
    href: '/gestion-financiacion',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Artistas',
    description:
      'Gestiona los perfiles de artistas y selecciona al artista destacado de la semana.',
    href: '/revision-actores',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Proyectos',
    description:
      'Gestiona proyectos culturales y selecciona el proyecto destacado de la portada.',
    href: '/revision-editorial',
    status: 'Activo',
    available: true,
  },
  {
    title: 'Espacios',
    description:
      'Registra talleres, estudios, galerías, residencias, laboratorios y espacios culturales.',
    href: '/revision-ecosistema',
    status: 'Activo',
    available: true,
  },
];

export default async function AdminPage() {
  const access = await canAccessWorkspace();

  if (!access.authenticated) {
    redirect('/login?redirect=/admin');
  }

  if (!access.authorized) {
    redirect('/acceso-denegado');
  }

  const displayName =
    access.profile?.full_name?.trim() ||
    access.profile?.email ||
    'Miembro del equipo';

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
              Cultura Está
            </p>

            <p className="mt-2 text-xl font-semibold">
              Workspace editorial
            </p>
          </div>

          <div className="flex items-center gap-4">
  <Link
    href="/"
    className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white/40"
  >
    Ver portada
  </Link>

  <LogoutButton />
</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
            Panel editorial
          </p>

          <h1 className="mt-7 text-5xl font-bold leading-[0.98] md:text-6xl">
            Todo lo que publica y activa Cultura Está.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#9A9A9A]">
            Desde este espacio se administran los contenidos del medio y,
            progresivamente, los módulos internos del ecosistema.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[#B0B0B0]">
            Sesión activa: {displayName}
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.title}
              className="flex min-h-[255px] flex-col rounded-[26px] border border-white/10 bg-[#090909] p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <h2 className="text-2xl font-semibold">
                  {module.title}
                </h2>

                <span
                  className={
                    module.available
                      ? 'rounded-full bg-[#D9FF00] px-3 py-1 text-xs font-bold text-black'
                      : 'rounded-full border border-white/10 px-3 py-1 text-xs text-[#666666]'
                  }
                >
                  {module.status}
                </span>
              </div>

              <p className="mt-5 leading-relaxed text-[#8A8A8A]">
                {module.description}
              </p>

              <div className="mt-auto pt-8">
                {module.available ? (
                  <Link
                    href={module.href}
                    className="font-bold text-[#D9FF00] transition hover:text-white"
                  >
                    Abrir módulo →
                  </Link>
                ) : (
                  <span className="text-sm text-[#555555]">
                    Módulo todavía no habilitado
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
