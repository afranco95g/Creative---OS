import { supabase } from '../../lib/supabase/client';
import { z } from 'zod';

export type SpaceRoomStatus = 'draft' | 'published' | 'archived';

export interface SpaceRoom {
  id: string;
  spaceId: string;
  name: string;
  slug: string;
  description: string;
  capacity: number | null;
  possibleUses: string[];
  status: SpaceRoomStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SpaceRoomRow {
  id: string;
  space_id: string;
  name: string;
  slug: string;
  description: string;
  capacity: number | null;
  possible_uses: string[];
  status: SpaceRoomStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const SPACE_ROOM_COLUMNS =
  'id, space_id, name, slug, description, capacity, possible_uses, status, created_by, created_at, updated_at';

function mapRoomRow(row: SpaceRoomRow): SpaceRoom {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    capacity: row.capacity,
    possibleUses: row.possible_uses,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Salones visibles para quien administra el espacio (borrador y
 * publicados). Depende de la política RLS "Managers can view their
 * rooms" — si el usuario no tiene membresía activa sobre el espacio,
 * Supabase devuelve una lista vacía, no un error.
 */
export async function listRoomsForSpace(spaceId: string): Promise<SpaceRoom[]> {
  const { data, error } = await supabase
    .from('space_rooms')
    .select(SPACE_ROOM_COLUMNS)
    .eq('space_id', spaceId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapRoomRow(row as SpaceRoomRow));
}

/** Un salón publicado, para la galería pública (sin sesión). */
export async function getPublishedRoom(spaceId: string, slug: string): Promise<SpaceRoom | null> {
  const { data, error } = await supabase
    .from('space_rooms')
    .select(SPACE_ROOM_COLUMNS)
    .eq('space_id', spaceId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapRoomRow(data as SpaceRoomRow);
}

const createRoomSchema = z.object({
  spaceId: z.string().uuid(),
  name: z.string().trim().min(1, 'El salón necesita un nombre.'),
  description: z.string().trim().optional(),
  capacity: z.number().int().positive().optional(),
  possibleUses: z.array(z.string().trim().min(1)).optional(),
});

export type CreateSpaceRoomInput = z.infer<typeof createRoomSchema>;

/**
 * Genera el slug único del salón dentro de su espacio llamando a
 * make_unique_slug (función ya existente en la base, usada por
 * spaces/people/funders) — no se reimplementa la lógica de slug aquí.
 */
async function generateRoomSlug(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('make_unique_slug', {
    source_value: name,
  });

  if (error) throw error;
  if (!data) throw new Error('No fue posible generar el identificador del salón.');

  return data as string;
}

export async function createRoom(input: CreateSpaceRoomInput): Promise<SpaceRoom> {
  const parsed = createRoomSchema.parse(input);
  const slug = await generateRoomSlug(parsed.name);

  const { data, error } = await supabase
    .from('space_rooms')
    .insert({
      space_id: parsed.spaceId,
      name: parsed.name,
      slug,
      description: parsed.description ?? '',
      capacity: parsed.capacity ?? null,
      possible_uses: parsed.possibleUses ?? [],
    })
    .select(SPACE_ROOM_COLUMNS)
    .single();

  if (error) throw error;

  return mapRoomRow(data as SpaceRoomRow);
}

const updateRoomSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  possibleUses: z.array(z.string().trim().min(1)).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type UpdateSpaceRoomInput = z.infer<typeof updateRoomSchema>;

export async function updateRoom(roomId: string, input: UpdateSpaceRoomInput): Promise<SpaceRoom> {
  const parsed = updateRoomSchema.parse(input);

  const patch: Record<string, unknown> = {};
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.description !== undefined) patch.description = parsed.description;
  if (parsed.capacity !== undefined) patch.capacity = parsed.capacity;
  if (parsed.possibleUses !== undefined) patch.possible_uses = parsed.possibleUses;
  if (parsed.status !== undefined) patch.status = parsed.status;

  const { data, error } = await supabase
    .from('space_rooms')
    .update(patch)
    .eq('id', roomId)
    .select(SPACE_ROOM_COLUMNS)
    .single();

  if (error) throw error;

  return mapRoomRow(data as SpaceRoomRow);
}

// ============================================================
// Buscador para el Paso 2 del wizard de creación de proyectos
// (specs/wizard-creacion-proyectos-hibrido.md). Reutiliza space_rooms
// y spaces tal como existen — no agrega tablas ni campos nuevos, solo
// una consulta de lectura pública sobre lo que ya se muestra en el
// ecosistema (salones y espacios publicados).
// ============================================================

export interface WizardSpaceSearchFilters {
  minCapacity?: number;
  city?: string;
  equipmentCategories?: string[];
}

export interface WizardSpaceSearchResult {
  roomId: string;
  roomName: string;
  roomSlug: string;
  capacity: number | null;
  possibleUses: string[];
  spaceId: string;
  spaceName: string;
  spaceSlug: string;
  city: string | null;
  coverPhotoUrl: string | null;
}

interface WizardSpaceSearchRow {
  id: string;
  name: string;
  slug: string;
  capacity: number | null;
  possible_uses: string[];
  space_id: string;
  spaces: {
    name: string;
    slug: string;
    city: string | null;
  } | null;
}

const SPACE_MEDIA_BUCKET_FOR_SEARCH = 'space-media';

/**
 * Salones publicados, de cualquier espacio publicado, para el
 * buscador del Paso 2 del wizard. Sin sesión requerida — misma
 * visibilidad que la galería pública de espacios.
 */
export async function searchPublishedRoomsForWizard(
  filters: WizardSpaceSearchFilters
): Promise<WizardSpaceSearchResult[]> {
  let roomIdsFilter: string[] | null = null;

  if (filters.equipmentCategories && filters.equipmentCategories.length > 0) {
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from('space_room_inventory')
      .select('room_id')
      .in('category_key', filters.equipmentCategories);

    if (inventoryError) throw inventoryError;

    roomIdsFilter = Array.from(
      new Set((inventoryRows ?? []).map((row) => row.room_id as string))
    );

    if (roomIdsFilter.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from('space_rooms')
    .select(
      'id, name, slug, capacity, possible_uses, space_id, spaces!inner(name, slug, city, status)'
    )
    .eq('status', 'published')
    .eq('spaces.status', 'published')
    .order('name', { ascending: true });

  if (filters.minCapacity) {
    query = query.gte('capacity', filters.minCapacity);
  }

  if (filters.city) {
    query = query.ilike('spaces.city', `%${filters.city}%`);
  }

  if (roomIdsFilter) {
    query = query.in('id', roomIdsFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as WizardSpaceSearchRow[];
  const roomIds = rows.map((row) => row.id);

  const coverPhotoByRoomId = new Map<string, string>();
  if (roomIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await supabase
      .from('space_media')
      .select('room_id, storage_path, display_order')
      .eq('media_type', 'photo')
      .in('room_id', roomIds)
      .order('display_order', { ascending: true });

    if (mediaError) throw mediaError;

    for (const row of mediaRows ?? []) {
      if (coverPhotoByRoomId.has(row.room_id)) continue;
      const { data: publicUrlData } = supabase.storage
        .from(SPACE_MEDIA_BUCKET_FOR_SEARCH)
        .getPublicUrl(row.storage_path);
      coverPhotoByRoomId.set(row.room_id, publicUrlData.publicUrl);
    }
  }

  return rows.map((row) => ({
    roomId: row.id,
    roomName: row.name,
    roomSlug: row.slug,
    capacity: row.capacity,
    possibleUses: row.possible_uses,
    spaceId: row.space_id,
    spaceName: row.spaces?.name ?? '',
    spaceSlug: row.spaces?.slug ?? '',
    city: row.spaces?.city ?? null,
    coverPhotoUrl: coverPhotoByRoomId.get(row.id) ?? null,
  }));
}
