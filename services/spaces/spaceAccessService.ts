import { createClient } from '../../lib/supabase/server';

export interface SpaceToolsAccess {
  authenticated: boolean;
  canAccess: boolean;
  isStaff: boolean;
}

/**
 * Guardia de acceso para la herramienta de espacios
 * (/workspace/espacio). A diferencia de canAccessWorkspace()
 * (services/auth/workspace.ts, que gobierna /admin/* — solo staff),
 * esta también deja pasar a cualquier cuenta con membresía activa en
 * space_memberships: quien administra Stainless Space, Oasis, Taller
 * 108 o Club del Café entra con su propia cuenta, no solo el staff del
 * ecosistema.
 */
export async function canAccessSpaceTools(): Promise<SpaceToolsAccess> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false, canAccess: false, isStaff: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isStaff = profile?.role === 'ecosystem_admin' || profile?.role === 'super_admin';

  if (isStaff) {
    return { authenticated: true, canAccess: true, isStaff: true };
  }

  const { data: membership } = await supabase
    .from('space_memberships')
    .select('id')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return { authenticated: true, canAccess: Boolean(membership), isStaff: false };
}
