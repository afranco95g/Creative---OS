import {
  createClient,
} from '../../lib/supabase/server';

export type PlatformRole =
  | 'member'
  | 'journalist'
  | 'media_admin'
  | 'ecosystem_admin'
  | 'finance_admin'
  | 'super_admin';

const VALID_ROLES:
  PlatformRole[] = [
    'member',
    'journalist',
    'media_admin',
    'ecosystem_admin',
    'finance_admin',
    'super_admin',
  ];

function isPlatformRole(
  value: unknown
): value is PlatformRole {
  return (
    typeof value === 'string' &&
    VALID_ROLES.includes(
      value as PlatformRole
    )
  );
}

export async function canAccessWorkspace() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      authorized: false,
      profile: null,
      capabilities: null,
    };
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (
    error ||
    !profile ||
    profile.is_active === false
  ) {
    return {
      authenticated: true,
      authorized: false,
      profile: null,
      capabilities: null,
    };
  }

  const role:
    PlatformRole =
    isPlatformRole(profile.role)
      ? profile.role
      : 'member';

  const canWriteEditorial =
    role === 'journalist' ||
    role === 'media_admin' ||
    role === 'super_admin';

  const canPublishEditorial =
    role === 'media_admin' ||
    role === 'super_admin';

  const canApproveProjectEligibility =
    role ===
      'ecosystem_admin' ||
    role === 'super_admin';

  const canManageRoles =
    role === 'super_admin';

  const canManageEcosystem =
    role === 'ecosystem_admin' ||
    role === 'super_admin';

  const canManageFinance =
    role === 'finance_admin' ||
    role === 'super_admin';

  const canAccessAdmin =
    canWriteEditorial ||
    canManageEcosystem ||
    canManageFinance;

  return {
    authenticated: true,

    /*
     * /admin corresponde al workspace editorial.
     * Los miembros normales y los administradores
     * del ecosistema no entran automáticamente al CMS.
     */
    authorized:
      canWriteEditorial,

    profile: {
      ...profile,
      role,
    },

    capabilities: {
      canAccessStudio: true,

      canCreateProjects: true,

      canWriteEditorial,

      canPublishEditorial,

      canApproveProjectEligibility,

      canAccessAdmin,

      canManageEcosystem,

      canManageFinance,

      canViewAudit:
        role === 'super_admin',

      canViewStrategicIntelligence:
        canManageEcosystem,

      canManageRoles,
    },
  };
}
