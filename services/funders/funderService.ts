import { supabase } from '@/lib/supabase/client';

export interface FunderRecord {
  id: string;
  name: string;
  service_catalog: string[];
  funder_type: string;
}

/**
 * Devuelve el funder tipo "agencia" (Imagine Company) SOLO cuando el actor
 * activo es, él mismo, ese funder -- nunca "el primero de la tabla" como
 * fallback para cualquier otro tipo de actor. Antes, cualquier persona o
 * espacio con el actor activo distinto de una "marca" (brand:) recibía sin
 * querer el primer funder tipo agencia que existiera (normalmente Imagine),
 * lo que le daba acceso de lectura Y escritura al catálogo de servicios de
 * Imagine, y mostraba el curso "Music Business" (que solo debe vivir en el
 * perfil de Imagine, ver decisión de producto) a cualquier cuenta.
 */
export async function getAgencyFunder(activeActorId?: string | null): Promise<FunderRecord | null> {
  if (!activeActorId || !activeActorId.startsWith('brand:')) {
    return null;
  }

  const rawId = activeActorId.replace('brand:', '');

  const { data } = await supabase
    .from('funders')
    .select('id, name, service_catalog, funder_type')
    .eq('id', rawId)
    .eq('funder_type', 'agency')
    .maybeSingle();

  return data as FunderRecord | null;
}

export async function updateFunderServiceCatalog(funderId: string, catalog: string[]): Promise<void> {
  const { error } = await supabase
    .from('funders')
    .update({ service_catalog: catalog })
    .eq('id', funderId);

  if (error) throw error;
}
