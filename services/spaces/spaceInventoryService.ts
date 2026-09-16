import { supabase } from '../../lib/supabase/client';
import { z } from 'zod';

export interface SpaceInventoryCategory {
  key: string;
  label: string;
}

/** Vocabulario de categorías, sembrado con 5 y abierto a crecer. */
export async function listInventoryCategories(): Promise<SpaceInventoryCategory[]> {
  const { data, error } = await supabase
    .from('space_inventory_categories')
    .select('key, label')
    .order('label', { ascending: true });

  if (error) throw error;

  return (data ?? []) as SpaceInventoryCategory[];
}

function slugifyCategoryKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const createCategorySchema = z.object({
  label: z.string().trim().min(1, 'La categoría necesita un nombre.'),
});

/**
 * Crea una categoría nueva si no existe una con la misma clave (misma
 * versión normalizada del nombre). Decisión explícita de Andrés: el
 * vocabulario de inventario, a diferencia de service_categories, puede
 * crecer sobre la marcha.
 */
export async function createInventoryCategory(
  input: z.infer<typeof createCategorySchema>
): Promise<SpaceInventoryCategory> {
  const parsed = createCategorySchema.parse(input);
  const key = slugifyCategoryKey(parsed.label);

  if (!key) {
    throw new Error('No fue posible generar una clave válida para esta categoría.');
  }

  const { data, error } = await supabase
    .from('space_inventory_categories')
    .upsert(
      { key, label: parsed.label },
      { onConflict: 'key', ignoreDuplicates: true }
    )
    .select('key, label')
    .maybeSingle();

  if (error) throw error;

  if (data) return data as SpaceInventoryCategory;

  // Ya existía (ignoreDuplicates no devuelve fila) — se devuelve la existente.
  const { data: existing, error: existingError } = await supabase
    .from('space_inventory_categories')
    .select('key, label')
    .eq('key', key)
    .single();

  if (existingError) throw existingError;

  return existing as SpaceInventoryCategory;
}

export interface SpaceRoomInventoryItem {
  id: string;
  roomId: string;
  categoryKey: string;
  name: string;
  quantity: number;
  includedInBaseRental: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface SpaceRoomInventoryRow {
  id: string;
  room_id: string;
  category_key: string;
  name: string;
  quantity: number;
  included_in_base_rental: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

const INVENTORY_ITEM_COLUMNS =
  'id, room_id, category_key, name, quantity, included_in_base_rental, notes, created_at, updated_at';

function mapInventoryRow(row: SpaceRoomInventoryRow): SpaceRoomInventoryItem {
  return {
    id: row.id,
    roomId: row.room_id,
    categoryKey: row.category_key,
    name: row.name,
    quantity: row.quantity,
    includedInBaseRental: row.included_in_base_rental,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listInventoryForRoom(roomId: string): Promise<SpaceRoomInventoryItem[]> {
  const { data, error } = await supabase
    .from('space_room_inventory')
    .select(INVENTORY_ITEM_COLUMNS)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapInventoryRow(row as SpaceRoomInventoryRow));
}

const createInventoryItemSchema = z.object({
  roomId: z.string().uuid(),
  categoryKey: z.string().trim().min(1),
  name: z.string().trim().min(1, 'El equipo necesita un nombre.'),
  quantity: z.number().int().positive().default(1),
  includedInBaseRental: z.boolean().default(true),
  notes: z.string().trim().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export async function createInventoryItem(
  input: CreateInventoryItemInput
): Promise<SpaceRoomInventoryItem> {
  const parsed = createInventoryItemSchema.parse(input);

  const { data, error } = await supabase
    .from('space_room_inventory')
    .insert({
      room_id: parsed.roomId,
      category_key: parsed.categoryKey,
      name: parsed.name,
      quantity: parsed.quantity,
      included_in_base_rental: parsed.includedInBaseRental,
      notes: parsed.notes ?? '',
    })
    .select(INVENTORY_ITEM_COLUMNS)
    .single();

  if (error) throw error;

  return mapInventoryRow(data as SpaceRoomInventoryRow);
}

const updateInventoryItemSchema = z.object({
  categoryKey: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  includedInBaseRental: z.boolean().optional(),
  notes: z.string().trim().optional(),
});

export async function updateInventoryItem(
  itemId: string,
  input: z.infer<typeof updateInventoryItemSchema>
): Promise<SpaceRoomInventoryItem> {
  const parsed = updateInventoryItemSchema.parse(input);

  const patch: Record<string, unknown> = {};
  if (parsed.categoryKey !== undefined) patch.category_key = parsed.categoryKey;
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.quantity !== undefined) patch.quantity = parsed.quantity;
  if (parsed.includedInBaseRental !== undefined) patch.included_in_base_rental = parsed.includedInBaseRental;
  if (parsed.notes !== undefined) patch.notes = parsed.notes;

  const { data, error } = await supabase
    .from('space_room_inventory')
    .update(patch)
    .eq('id', itemId)
    .select(INVENTORY_ITEM_COLUMNS)
    .single();

  if (error) throw error;

  return mapInventoryRow(data as SpaceRoomInventoryRow);
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('space_room_inventory').delete().eq('id', itemId);

  if (error) throw error;
}
