import { BarChart3 } from 'lucide-react';

/**
 * Bloque de métricas de impacto — solo para roles de producción/
 * gestión (producer, manager, cultural_manager, space_manager). Usa
 * la lista de proyectos públicos que la página ya cargó (misma
 * consulta que alimenta la sección "Proyectos"), sin agregar una
 * consulta nueva.
 */
export function ImpactMetricsShowcase({ publishedProjectCount }: { publishedProjectCount: number }) {
  if (publishedProjectCount === 0) return null;

  return (
    <div className="flex items-center gap-4 border border-borde bg-superficie-elevada p-5">
      <BarChart3 className="text-texto-principal" size={22} />
      <div>
        <p className="text-2xl font-bold text-texto-largo">{publishedProjectCount}</p>
        <p className="text-xs uppercase tracking-[0.14em] text-texto-largo">
          {publishedProjectCount === 1 ? 'Proyecto público' : 'Proyectos públicos'}
        </p>
      </div>
    </div>
  );
}
