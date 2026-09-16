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
