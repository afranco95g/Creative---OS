import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { canAccessWorkspace, type PlatformRole } from '@/services/auth/workspace';

/**
 * Punto único de autenticación/autorización para las rutas API que
 * reemplazan escrituras directas cliente→Supabase (ver
 * AUDIT_REPORT_2026-09-21.md, hallazgo S2, y
 * specs/escrituras-admin-validadas-server-side.md).
 *
 * No duplica el chequeo de rol: reusa canAccessWorkspace() de
 * services/auth/workspace.ts, que ya hace auth.getUser() + consulta a
 * profiles server-side.
 */

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type AuthContext = Awaited<ReturnType<typeof canAccessWorkspace>> & {
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/** Exige sesión autenticada. No exige ningún rol/capacidad específico —
 *  úsalo cuando la autorización real depende de datos (p. ej. "es dueño
 *  de este proyecto"), no de un rol de plataforma. */
export async function requireAuthenticatedUser(): Promise<AuthContext> {
  const access = await canAccessWorkspace();
  if (!access.authenticated) {
    throw new HttpError(401, 'Sesión requerida.');
  }
  const supabase = await createClient();
  return { ...access, supabase };
}

/** Exige sesión autenticada + una capacidad de plataforma específica
 *  (canManageFinance, canManageEcosystem, etc.) tal como ya las calcula
 *  canAccessWorkspace(). */
export async function requireCapability(
  capability: keyof NonNullable<Awaited<ReturnType<typeof canAccessWorkspace>>['capabilities']>
): Promise<AuthContext> {
  const ctx = await requireAuthenticatedUser();
  if (!ctx.capabilities?.[capability]) {
    throw new HttpError(403, 'No tienes permiso para esta acción.');
  }
  return ctx;
}

/** Exige sesión autenticada + rol de plataforma exacto (para los pocos
 *  casos donde la página ya gatea por access.profile?.role==='super_admin'
 *  en vez de por capability, como /admin/ticketing). */
export async function requireRole(role: PlatformRole): Promise<AuthContext> {
  const ctx = await requireAuthenticatedUser();
  if (ctx.profile?.role !== role) {
    throw new HttpError(403, 'No tienes permiso para esta acción.');
  }
  return ctx;
}

/** Envuelve un handler de ruta y traduce HttpError / errores de zod a la
 *  respuesta JSON { error } con el status correcto, en vez de que cada
 *  ruta repita su propio try/catch. */
export async function handleRoute(fn: () => Promise<unknown>): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err && typeof err === 'object' && 'issues' in err) {
      // Error de zod: primer mensaje, en vez del objeto crudo.
      const zodError = err as { issues: { message: string }[] };
      return NextResponse.json(
        { error: zodError.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado.' },
      { status: 400 }
    );
  }
}
