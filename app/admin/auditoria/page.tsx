import { redirect } from 'next/navigation';

import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { loadAuditLog } from '@/services/admin/superadminService';
import { canAccessWorkspace } from '@/services/auth/workspace';

export default async function AuditPage() {
  const access = await canAccessWorkspace();
  if (!access.authenticated) redirect('/login?redirect=/admin/auditoria');
  if (!access.capabilities?.canViewAudit) redirect('/acceso-denegado');
  const audit = await loadAuditLog();

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <AdminSectionHeader eyebrow="Control interno" title="Auditoría administrativa" description="Registro cronológico e inmutable de decisiones críticas. Esta vista permite consulta, no modificación ni eliminación." />
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {audit.error ? <p className="mb-8 border-l-2 border-naranja pl-4 text-sm text-naranja">Aplica la migración 026 para activar la auditoría.</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead><tr className="border-y border-borde/10 text-xs uppercase tracking-[0.16em] text-texto-largo"><th className="py-4">Fecha</th><th>Acción</th><th>Entidad</th><th>Motivo</th><th>Resultado</th></tr></thead>
            <tbody>
              {audit.data.map((entry) => (
                <tr key={entry.id} className="border-b border-borde/10 text-sm">
                  <td className="whitespace-nowrap py-5 pr-6 text-texto-largo">{new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.created_at))}</td>
                  <td className="pr-6 font-semibold">{entry.action}</td>
                  <td className="pr-6 text-texto-largo">{entry.entity_type}{entry.entity_id ? ` · ${entry.entity_id}` : ''}</td>
                  <td className="max-w-md pr-6 text-texto-largo">{entry.reason || 'Sin motivo registrado'}</td>
                  <td><span className="border border-borde/15 px-2 py-1 text-xs uppercase">{entry.result}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!audit.error && audit.data.length === 0 ? <p className="py-12 text-center text-texto-largo">Aún no hay acciones administrativas registradas.</p> : null}
      </section>
    </main>
  );
}
