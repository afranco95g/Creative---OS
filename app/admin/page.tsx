import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Images,
  Landmark,
  Network,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import LogoutButton from '@/components/admin/LogoutButton';
import { loadSuperadminOverview } from '@/services/admin/superadminService';
import { canAccessWorkspace, type PlatformRole } from '@/services/auth/workspace';

const modules = [
  { title: 'Inteligencia', description: 'Tendencias agregadas con umbral de privacidad.', href: '/admin/inteligencia', icon: BarChart3, roles: ['ecosystem_admin', 'super_admin'] },
  { title: 'Actores', description: 'Revisión y validación de actores del ecosistema.', href: '/revision-actores', icon: Users, roles: ['ecosystem_admin', 'super_admin'] },
  { title: 'Aplicaciones', description: 'Proyectos y propuestas enviados al ecosistema.', href: '/revision-ecosistema', icon: ClipboardCheck, roles: ['ecosystem_admin', 'super_admin'] },
  { title: 'Proyectos propios', description: 'Crea proyectos desde una identidad administrada.', href: '/studio?new=1', icon: Network, roles: ['super_admin'] },
  { title: 'Programación', description: 'Experiencias, agenda y operación cultural.', href: '/gestion-agenda', icon: Activity, roles: ['ecosystem_admin', 'super_admin'] },
  { title: 'Calendario maestro', description: 'Agenda conectada por proyecto, actividad y publicación.', href: '/admin/calendario', icon: CalendarDays, roles: ['ecosystem_admin', 'super_admin'] },
  { title: 'Ticketing', description: 'Tipos de entrada, capacidad, productos y precios.', href: '/admin/ticketing', icon: Ticket, roles: ['super_admin'] },
  { title: 'Productos y marcas', description: 'Cola de productos, márgenes y política comercial.', href: '/admin/productos', icon: Package, roles: ['ecosystem_admin', 'super_admin'] },
  { title: 'Presupuesto', description: 'Líneas vivas, ejecución, escenarios y exportación.', href: '/admin/presupuesto', icon: WalletCards, roles: ['finance_admin', 'super_admin'] },
  { title: 'Finanzas', description: 'Convocatorias, postulaciones y fuentes de financiación.', href: '/gestion-financiacion', icon: Landmark, roles: ['finance_admin', 'super_admin'] },
  { title: 'Historias', description: 'Redacción, revisión, programación y publicación.', href: '/admin/stories', icon: FileText, roles: ['journalist', 'media_admin', 'super_admin'] },
  { title: 'Portada', description: 'Orden y publicación de secciones del medio.', href: '/admin/homepage', icon: BookOpen, roles: ['media_admin', 'super_admin'] },
  { title: 'Multimedia', description: 'Imágenes y videos editoriales reutilizables.', href: '/admin/media', icon: Images, roles: ['journalist', 'media_admin', 'super_admin'] },
  { title: 'Auditoría', description: 'Registro inmutable de acciones administrativas.', href: '/admin/auditoria', icon: ScrollText, roles: ['super_admin'] },
  { title: 'Reportes', description: 'Indicadores, alertas e informes periódicos exportables.', href: '/admin/reportes', icon: BarChart3, roles: ['super_admin'] },
  { title: 'Configuración', description: 'Roles, políticas y parámetros estratégicos.', href: '/admin/configuracion', icon: Settings, roles: ['super_admin'] },
] as const;

const metricLabels: Array<[keyof Awaited<ReturnType<typeof loadSuperadminOverview>>['data'], string]> = [
  ['pendingApplications', 'Aplicaciones pendientes'],
  ['newSignals', 'Señales nuevas'],
  ['upcomingExperiences', 'Experiencias próximas'],
  ['pendingEditorial', 'Contenidos pendientes'],
];

export default async function AdminPage() {
  const access = await canAccessWorkspace();
  if (!access.authenticated) redirect('/login?redirect=/admin');
  if (!access.capabilities?.canAccessAdmin) redirect('/acceso-denegado');

  const role = access.profile?.role as PlatformRole;
  const isSuperadmin = role === 'super_admin';
  const overview = isSuperadmin ? await loadSuperadminOverview() : null;
  const visibleModules = modules.filter((module) =>
    (module.roles as readonly PlatformRole[]).includes(role)
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D9FF00]">CULTURA ESTA</p>
            <p className="mt-1 text-lg font-semibold">{isSuperadmin ? 'Dirección del ecosistema' : 'Administración'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="border border-white/15 px-4 py-2 text-sm font-semibold hover:border-white/40">Ver portada</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[#D9FF00]"><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-[0.24em]">{role.replaceAll('_', ' ')}</span></div>
            <h1 className="mt-5 text-4xl font-bold md:text-5xl">{isSuperadmin ? 'Resumen ejecutivo' : 'Herramientas autorizadas'}</h1>
            <p className="mt-4 text-[#999]">Sesión activa: {access.profile?.full_name || access.profile?.email}</p>
          </div>
          {overview?.error ? <p className="max-w-md border-l-2 border-amber-400 pl-4 text-sm text-amber-200">Aplica la migración 026 para activar los indicadores estratégicos.</p> : null}
        </div>

        {isSuperadmin && overview ? (
          <div className="grid border-b border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {metricLabels.map(([key, label]) => (
              <div key={key} className="border-white/10 py-7 sm:border-r sm:px-6 sm:first:pl-0">
                <p className="text-3xl font-bold text-[#D9FF00]">{String(overview.data[key])}</p>
                <p className="mt-2 text-sm text-[#888]">{label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {isSuperadmin ? (
          <section className="border-b border-white/10 py-9">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">Qué debería atender hoy</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Priority label="Aplicaciones sin revisar" value={overview?.data.pendingApplications ?? 0} href="/revision-ecosistema" />
              <Priority label="Publicaciones pendientes" value={overview?.data.pendingEditorial ?? 0} href="/admin/stories" />
              <Priority label="Experiencias próximas" value={overview?.data.upcomingExperiences ?? 0} href="/gestion-agenda" />
            </div>
          </section>
        ) : null}

        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.title} className="min-h-52 bg-[#080808] p-6">
                <Icon size={22} className="text-[#D9FF00]" />
                <h2 className="mt-6 text-xl font-semibold">{module.title}</h2>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#888]">{module.description}</p>
                {'disabled' in module && module.disabled ? (
                  <span className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#666]">En preparación</span>
                ) : (
                  <Link href={module.href} className="mt-6 inline-block font-semibold text-[#D9FF00] hover:text-white">Abrir módulo →</Link>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Priority({ label, value, href }: { label: string; value: number; href: string }) {
  return <Link href={href} className="flex items-center justify-between border border-white/10 bg-[#090909] p-5 hover:border-[#D9FF00]/60"><span className="text-sm text-[#aaa]">{label}</span><strong className="text-2xl">{value}</strong></Link>;
}
