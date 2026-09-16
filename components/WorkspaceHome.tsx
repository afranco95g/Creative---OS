'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Archive, FolderOpen, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { WorkspaceState } from '../types/workspace';
import { supabase } from '@/lib/supabase/client';
import { listCourses, Course, getModulesForCourse, CourseModuleWithLessonCount } from '@/services/courses/courseService';
import { getAgencyFunder, updateFunderServiceCatalog, FunderRecord } from '@/services/funders/funderService';

interface Props {
  workspace: WorkspaceState;
  onCreateProject: () => void;
  onOpenProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onRestoreProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

export function WorkspaceHome({
  workspace,
  onCreateProject,
  onOpenProject,
  onArchiveProject,
  onRestoreProject,
  onDeleteProject,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  // Agency state (Imagine Company)
  const [funderData, setFunderData] = useState<FunderRecord | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState<string>('');
  const [savingService, setSavingService] = useState<boolean>(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesMap, setModulesMap] = useState<Record<string, CourseModuleWithLessonCount[]>>({});
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const activeActor = useMemo(() => {
    if (!workspace.activeActorId) return workspace.actors[0] || null;
    return workspace.actors.find((a) => a.id === workspace.activeActorId) || workspace.actors[0] || null;
  }, [workspace.actors, workspace.activeActorId]);

  useEffect(() => {
    async function loadAgencyData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user is associated with an agency funder or Imagine Company
        const data = await getAgencyFunder(activeActor?.id ?? null);

        if (data) {
          setFunderData(data);
          setServices(Array.isArray(data.service_catalog) ? data.service_catalog : []);

          // Load courses for this actor
          const coursesList = await listCourses({ ownerActorId: data.id });
          setCourses(coursesList);

          for (const course of coursesList) {
            const formattedModules = await getModulesForCourse(course.id);
            setModulesMap((prev) => ({ ...prev, [course.id]: formattedModules }));
          }
        } else {
          // Fallback general para listar cursos disponibles
          const generalCourses = await listCourses();
          if (generalCourses.length > 0) {
            setCourses(generalCourses);
          }
        }
      } catch (err) {
        console.error('Error loading agency data in workspace:', err);
      }
    }

    loadAgencyData();
  }, [activeActor]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newService.trim();
    if (!trimmed || !funderData) return;

    try {
      setSavingService(true);
      const updatedCatalog = [...services, trimmed];

      await updateFunderServiceCatalog(funderData.id, updatedCatalog);

      setServices(updatedCatalog);
      setNewService('');
    } catch (err: any) {
      alert('No fue posible agregar el servicio: ' + (err.message || err));
    } finally {
      setSavingService(false);
    }
  };

  const isAgency =
    funderData?.funder_type === 'agency' ||
    funderData?.name?.toLowerCase().includes('imagine') ||
    activeActor?.type === 'funder' ||
    workspace.user?.email?.toLowerCase().includes('imagine') ||
    workspace.user?.name?.toLowerCase().includes('imagine');

  const activeCount = workspace.projects.filter((p) => p.lifecycleStatus !== 'archived').length;
  const projects = useMemo(
    () => workspace.projects.filter((p) => filter === 'all' || p.lifecycleStatus === filter),
    [workspace.projects, filter]
  );

  return (
    <main className="min-h-screen bg-superficie px-6 py-10 text-texto-largo sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="rounded-full border border-borde/15 px-4 py-2 text-xs text-texto-largo hover:border-borde hover:text-hueso transition">
                ← Volver al medio
              </Link>
              <Link href="/mi-ecosistema" className="rounded-full border border-borde/15 px-4 py-2 text-xs text-texto-largo hover:border-borde hover:text-hueso transition">
                Mi Ecosistema
              </Link>
              <Link href="/cursos/music-business" className="rounded-full bg-rojo-base/15 border border-rojo-base/40 px-4 py-2 text-xs font-bold text-texto-principal hover:bg-rojo-base hover:text-hueso transition">
                🎓 Aula Virtual Music Business →
              </Link>
            </div>
            <p className="mt-7 text-sm uppercase tracking-[.25em] text-texto-principal">Portal del Participante</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-6xl text-texto-principal">
              Hola, {workspace.user?.name ?? 'de nuevo'}.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-texto-largo">
              Este es tu centro de producción. Desarrolla cada proyecto con Creative OS, desde la idea hasta el presupuesto, el cronograma y la convocatoria.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/cursos/music-business"
              className="rounded-full border border-rojo-base bg-rojo-base/10 px-6 py-3 font-bold text-texto-principal hover:bg-rojo-base hover:text-hueso transition"
            >
              Ver Curso Music Business
            </Link>
            <button onClick={onCreateProject} className="rounded-full bg-rojo-base px-6 py-3 font-bold text-hueso hover:bg-rojo-base/90 transition">
              Crear nuevo proyecto
            </button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <Metric label="Proyectos activos" value={activeCount} />
          <Metric label="Archivados" value={workspace.projects.length - activeCount} />
          <Metric label="Total" value={workspace.projects.length} />
        </section>

        {/* Sección: Servicios que ofrecemos (condicionada a Agencia / Imagine) */}
        {isAgency && funderData && (
          <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
            <p className="text-xs uppercase text-texto-largo">Servicios que ofrecemos</p>
            <h3 className="mt-3 text-2xl font-semibold">Catálogo de la agencia</h3>
            <p className="mt-3 text-sm leading-6 text-texto-largo">
              Servicios y capacidades ofrecidas por {funderData.name} para proyectos y marcas del ecosistema.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {services.length === 0 ? (
                <span className="text-sm italic text-texto-largo">No hay servicios registrados en el catálogo.</span>
              ) : (
                services.map((srv, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-borde/20 bg-superficie px-4 py-2 text-xs font-semibold text-hueso"
                  >
                    {srv}
                  </span>
                ))
              )}
            </div>

            <form onSubmit={handleAddService} className="mt-6 flex max-w-lg gap-3">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Nombre del nuevo servicio..."
                disabled={savingService}
                className="flex-1 rounded-xl border border-borde/15 bg-superficie px-4 py-2 text-sm text-hueso placeholder:text-texto-largo/50 focus:outline-none focus:border-texto-principal"
              />
              <button
                type="submit"
                disabled={savingService || !newService.trim()}
                className="rounded-full bg-rojo-base px-5 py-2 font-bold text-hueso disabled:opacity-50"
              >
                {savingService ? 'Guardando...' : 'Agregar'}
              </button>
            </form>
          </section>
        )}

        {/* Sección: Cursos (condicionada a Agencia / Imagine) */}
        {isAgency && (
          <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
            <p className="text-xs uppercase text-texto-largo">Formación y Programas</p>
            <h3 className="mt-3 text-2xl font-semibold">Cursos gestionados</h3>
            <p className="mt-3 text-sm leading-6 text-texto-largo">
              Programas educativos creados y dictados por el equipo.
            </p>

            <div className="mt-6 space-y-4">
              {courses.length === 0 ? (
                <p className="text-sm italic text-texto-largo">No hay cursos registrados para esta agencia.</p>
              ) : (
                courses.map((course) => {
                  const modules = modulesMap[course.id] || [];
                  const totalLessons = modules.reduce((acc, m) => acc + m.lessonCount, 0);
                  const isExpanded = expandedCourseId === course.id;

                  return (
                    <article
                      key={course.id}
                      className="overflow-hidden rounded-2xl border border-borde/10 bg-superficie"
                    >
                      <div
                        onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                        className="flex cursor-pointer flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between transition hover:bg-superficie-elevada/50 select-none"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-semibold text-hueso">{course.title}</h4>
                            <span className="rounded-full border border-borde/20 bg-superficie-elevada px-3 py-0.5 text-xs font-semibold uppercase text-texto-principal">
                              {course.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                            <p className="text-xs text-texto-largo">
                              {modules.length > 0
                                ? `${modules.length} módulos · ${totalLessons} lecciones temáticas y recursos descargables.`
                                : 'Cargando módulos...'}
                            </p>
                            <Link
                              href="/cursos/music-business"
                              className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 text-xs font-bold text-hueso hover:bg-rojo-base/90 transition shadow-sm"
                            >
                              Abrir plataforma del curso →
                            </Link>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-texto-principal">
                          {isExpanded ? (
                            <>Ocultar módulos <ChevronUp size={16} /></>
                          ) : (
                            <>Ver módulos <ChevronDown size={16} /></>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-borde/10 bg-superficie-elevada/30 p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-texto-largo">
                              Contenido del programa
                            </p>
                            <Link
                              href="/cursos/music-business"
                              className="text-xs font-bold text-texto-principal hover:underline"
                            >
                              Ver en aula virtual interactiva →
                            </Link>
                          </div>
                          {modules.length === 0 ? (
                            <p className="text-xs text-texto-largo italic">No hay módulos disponibles.</p>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {modules.map((mod, idx) => (
                                <div
                                  key={mod.id}
                                  className="flex items-center justify-between rounded-xl border border-borde/10 bg-superficie p-4"
                                >
                                  <div className="text-sm font-medium text-hueso truncate mr-2">
                                    <span className="mr-2 text-xs font-bold text-texto-principal">{idx + 1}.</span>
                                    {mod.title}
                                  </div>
                                  <span className="shrink-0 rounded-full border border-borde/10 bg-superficie-elevada px-2.5 py-0.5 text-xs text-texto-largo">
                                    {mod.lessonCount} {mod.lessonCount === 1 ? 'lección' : 'lecciones'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-texto-largo">Mesas de producción</p>
              <h2 className="mt-2 text-3xl font-semibold">Mis proyectos</h2>
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'archived'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    filter === v ? 'bg-rojo-base font-bold text-hueso' : 'border border-borde/15 text-texto-largo'
                  }`}
                >
                  {v === 'all' ? 'Todos' : v === 'active' ? 'Activos' : 'Archivados'}
                </button>
              ))}
            </div>
          </div>

          {!projects.length ? (
            <div className="rounded-3xl border border-dashed border-borde/15 p-10">
              <h3 className="text-2xl font-semibold">
                {filter === 'archived' ? 'No hay proyectos archivados' : 'Crea tu primer proyecto'}
              </h3>
              <p className="mt-3 text-texto-largo">
                {filter === 'archived'
                  ? 'Los proyectos que archives aparecerán aquí y podrás restaurarlos.'
                  : 'Creative OS abrirá una Mesa de Producción conectada a todas tus herramientas.'}
              </p>
              {filter !== 'archived' ? (
                <button onClick={onCreateProject} className="mt-6 rounded-full bg-rojo-base px-5 py-2 font-bold text-hueso">
                  Nuevo proyecto
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="rounded-3xl border border-borde/10 bg-superficie-elevada p-6">
                  <div className="flex justify-between">
                    <p className="text-xs uppercase text-texto-largo">{project.category}</p>
                    {project.lifecycleStatus === 'archived' ? (
                      <span className="rounded-full bg-borde/5 px-3 py-1 text-xs text-texto-largo">Archivado</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold">{project.title}</h3>
                  <p className="mt-3 line-clamp-3 min-h-16 text-sm leading-6 text-texto-largo">
                    {project.description || 'Proyecto sin descripción inicial.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso"
                    >
                      <FolderOpen size={15} /> Abrir
                    </button>
                    {project.lifecycleStatus === 'archived' ? (
                      <>
                        <button
                          onClick={() => onRestoreProject(project.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-borde/15 px-4 py-2 text-sm"
                        >
                          <RotateCcw size={15} /> Restaurar
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(project.id);
                            setConfirmation('');
                          }}
                          className="rounded-full border border-borde p-2 text-rojo-base"
                          title="Eliminar definitivamente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onArchiveProject(project.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-borde/15 px-4 py-2 text-sm text-texto-largo"
                      >
                        <Archive size={15} /> Archivar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Link href="/#historias" className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
            <p className="text-xs uppercase text-texto-largo">Medio</p>
            <h3 className="mt-3 text-2xl font-semibold">Inspiración y legitimación</h3>
            <p className="mt-3 text-sm leading-6 text-texto-largo">
              Explora historias, espacios y procesos culturales destacados.
            </p>
          </Link>
          <Link href="/ecosistema" className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
            <p className="text-xs uppercase text-texto-largo">Ecosistema</p>
            <h3 className="mt-3 text-2xl font-semibold">Personas y conexiones</h3>
            <p className="mt-3 text-sm leading-6 text-texto-largo">
              Encuentra actores que pueden fortalecer tus proyectos.
            </p>
          </Link>
        </section>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
          <section className="w-full max-w-lg rounded-3xl border border-borde bg-superficie-elevada p-7">
            <p className="text-xs uppercase tracking-wider text-rojo-base">Segunda confirmación</p>
            <h2 className="mt-3 text-2xl font-semibold">Eliminar definitivamente</h2>
            <p className="mt-4 leading-7 text-texto-largo">
              Se eliminarán el proyecto, sus conversaciones, documentos, presupuesto, cronograma y todos los datos
              relacionados. Esta acción no se puede deshacer.
            </p>
            <label className="mt-6 block text-sm">
              Escribe <strong>ELIMINAR</strong>
              <input
                autoFocus
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-borde/15 bg-superficie-elevada p-3"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-full border border-borde/15 px-5 py-2">
                Cancelar
              </button>
              <button
                disabled={confirmation !== 'ELIMINAR'}
                onClick={() => {
                  if (confirmation === 'ELIMINAR') {
                    onDeleteProject(deleteTarget);
                    setDeleteTarget(null);
                  }
                }}
                className="rounded-full bg-rojo-base px-5 py-2 font-bold text-hueso disabled:opacity-30"
              >
                Sí, eliminar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-borde/10 bg-superficie-elevada p-6">
      <p className="text-xs uppercase text-texto-largo">{label}</p>
      <strong className="mt-3 block text-4xl text-texto-principal">{value}</strong>
    </article>
  );
}
