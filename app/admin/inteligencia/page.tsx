import { redirect } from 'next/navigation';

import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { loadEcosystemTrends } from '@/services/admin/superadminService';
import { canAccessWorkspace } from '@/services/auth/workspace';

export default async function IntelligencePage() {
  const access = await canAccessWorkspace();
  if (!access.authenticated) redirect('/login?redirect=/admin/inteligencia');
  if (!access.capabilities?.canViewStrategicIntelligence) redirect('/acceso-denegado');
  const trends = await loadEcosystemTrends();
  const maximum = Math.max(...trends.data.map((trend) => trend.signal_count), 1);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <AdminSectionHeader eyebrow="Inteligencia del ecosistema" title="Señales compartidas" description="Tendencias construidas únicamente con resúmenes estructurados, consentimiento activo y grupos de al menos tres cuentas. Las conversaciones privadas nunca aparecen aquí." />
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {trends.error ? <Notice text="La capa de inteligencia requiere la migración 026 en Supabase." /> : null}
        {!trends.error && trends.data.length === 0 ? <Notice text="Todavía no hay una tendencia que alcance el umbral mínimo de privacidad de tres participantes." /> : null}
        <div className="overflow-x-auto border-t border-white/10">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead><tr className="text-xs uppercase tracking-[0.16em] text-[#777]"><th className="py-4">Tema</th><th>Tipo</th><th>Categoría</th><th>Proyectos</th><th>Frecuencia</th></tr></thead>
            <tbody>
              {trends.data.map((trend) => (
                <tr key={`${trend.signal_type}-${trend.category}-${trend.normalized_topic}`} className="border-t border-white/10">
                  <td className="py-5 pr-8 font-semibold">{trend.normalized_topic}</td>
                  <td className="pr-8 text-sm text-[#aaa]">{trend.signal_type}</td>
                  <td className="pr-8 text-sm text-[#aaa]">{trend.category}</td>
                  <td className="pr-8 tabular-nums">{trend.project_count}</td>
                  <td className="w-64"><div className="flex items-center gap-3"><div className="h-2 flex-1 bg-white/10"><div className="h-full bg-[#D9FF00]" style={{ width: `${Math.max(8, (trend.signal_count / maximum) * 100)}%` }} /></div><span className="w-8 text-right tabular-nums">{trend.signal_count}</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Notice({ text }: { text: string }) {
  return <p className="mb-8 border-l-2 border-[#D9FF00] bg-white/[0.03] px-5 py-4 text-sm text-[#bbb]">{text}</p>;
}
