import { project } from '@/lib/data';
import { ArrowRight, Calendar, ClipboardList, FileText, Handshake, MapPin, Target, Users, Wallet } from 'lucide-react';

const cards = [
  { title: 'Objetivo general', icon: Target, body: project.objective },
  { title: 'Objetivos específicos', icon: ClipboardList, body: `${project.specificObjectives.length} objetivos definidos` },
  { title: 'Contexto', icon: MapPin, body: project.context },
  { title: 'Comunidad', icon: Users, body: project.community },
  { title: 'Actividades', icon: Calendar, body: `${project.activities.length} actividades planificadas` },
  { title: 'Cronograma', icon: Calendar, body: 'Primeras actividades inician en mayo 2024' },
  { title: 'Presupuesto', icon: Wallet, body: project.budget },
  { title: 'Alianzas', icon: Handshake, body: '3 alianzas por confirmar' },
  { title: 'Documentos', icon: FileText, body: '6 documentos disponibles' }
];

export function ProjectPanel() {
  return (
    <section className="min-h-screen px-5 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/45">← Mis proyectos</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight">{project.name}</h1>
          <p className="mt-2 text-white/55">{project.tagline}</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black uppercase">Exportar PDF</button>
          <button className="acid-button px-4 py-3 text-xs uppercase">Nueva conversación</button>
        </div>
      </div>
      <div className="mb-8 flex gap-6 border-b border-white/10 text-xs font-black uppercase text-white/55">
        {['Resumen', 'Objetivos', 'Actividades', 'Aliados', 'Documentos'].map((tab, index) => (
          <span key={tab} className={`pb-4 ${index === 0 ? 'border-b-2 border-acid text-white' : ''}`}>{tab}</span>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, icon: Icon, body }) => (
          <div key={title} className="card p-5">
            <Icon className="mb-5 text-acid" size={25} />
            <h3 className="text-sm font-black uppercase">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/62">{body}</p>
            <button className="mt-6 flex items-center gap-2 text-xs font-black uppercase text-white/80">Ver más <ArrowRight size={14} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
