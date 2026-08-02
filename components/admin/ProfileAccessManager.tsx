'use client';

import { Save } from 'lucide-react';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import type { PlatformRole } from '@/services/auth/workspace';

export interface AdminProfile {
  profile_id: string;
  email: string | null;
  full_name: string | null;
  role: PlatformRole;
  is_active: boolean;
  created_at: string;
}

const roles: PlatformRole[] = ['member', 'journalist', 'media_admin', 'ecosystem_admin', 'finance_admin', 'super_admin'];

export function ProfileAccessManager({ initialProfiles }: { initialProfiles: AdminProfile[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  function patchProfile(id: string, patch: Partial<AdminProfile>) {
    setProfiles((current) => current.map((profile) => profile.profile_id === id ? { ...profile, ...patch } : profile));
  }

  async function save(profile: AdminProfile) {
    const reason = reasons[profile.profile_id]?.trim();
    if (!reason) { setMessage('Escribe un motivo antes de cambiar un acceso.'); return; }
    setSavingId(profile.profile_id);
    setMessage('');
    const { error } = await supabase.rpc('manage_profile_access', {
      target_profile_id: profile.profile_id,
      requested_role: profile.role,
      requested_is_active: profile.is_active,
      requested_reason: reason,
    });
    setSavingId(null);
    setMessage(error ? error.message : `Acceso actualizado para ${profile.email ?? profile.full_name}.`);
    if (!error) setReasons((current) => ({ ...current, [profile.profile_id]: '' }));
  }

  return (
    <section>
      {message ? <p className="mb-6 border-l-2 border-[#D9FF00] pl-4 text-sm text-[#bbb]" role="status">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead><tr className="border-y border-white/10 text-xs uppercase tracking-[0.14em] text-[#777]"><th className="py-4">Cuenta</th><th>Rol</th><th>Estado</th><th>Motivo obligatorio</th><th><span className="sr-only">Guardar</span></th></tr></thead>
          <tbody>{profiles.map((profile) => (
            <tr key={profile.profile_id} className="border-b border-white/10">
              <td className="py-5 pr-5"><p className="font-semibold">{profile.full_name || 'Sin nombre'}</p><p className="mt-1 text-sm text-[#777]">{profile.email}</p></td>
              <td className="pr-5"><select value={profile.role} onChange={(event) => patchProfile(profile.profile_id, { role: event.target.value as PlatformRole })} className="w-48 border border-white/15 bg-[#0b0b0b] px-3 py-2 text-sm"><option value={profile.role}>{profile.role}</option>{roles.filter((role) => role !== profile.role).map((role) => <option key={role} value={role}>{role}</option>)}</select></td>
              <td className="pr-5"><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={profile.is_active} onChange={(event) => patchProfile(profile.profile_id, { is_active: event.target.checked })} className="h-4 w-4 accent-[#D9FF00]" />Activa</label></td>
              <td className="pr-5"><input value={reasons[profile.profile_id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [profile.profile_id]: event.target.value }))} placeholder="Motivo del cambio" className="w-full min-w-64 border border-white/15 bg-[#0b0b0b] px-3 py-2 text-sm" /></td>
              <td><button type="button" onClick={() => save(profile)} disabled={savingId === profile.profile_id} title="Guardar acceso" className="inline-flex h-10 w-10 items-center justify-center bg-[#D9FF00] text-black disabled:opacity-50"><Save size={17} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
