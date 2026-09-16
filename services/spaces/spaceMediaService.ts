import { supabase } from '../../lib/supabase/client';

const SPACE_MEDIA_BUCKET = 'space-media';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300 MB

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/quicktime'];

export type SpaceMediaType = 'photo' | 'video';

export interface SpaceMedia {
  id: string;
  roomId: string;
  inventoryItemId: string | null;
  mediaType: SpaceMediaType;
  url: string;
  storagePath: string;
  displayOrder: number;
  createdAt: string;
}

interface SpaceMediaRow {
  id: string;
  room_id: string;
  inventory_item_id: string | null;
  media_type: SpaceMediaType;
  storage_path: string;
  display_order: number;
  created_at: string;
}

const SPACE_MEDIA_COLUMNS =
  'id, room_id, inventory_item_id, media_type, storage_path, display_order, created_at';

function toPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(SPACE_MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function mapMediaRow(row: SpaceMediaRow): SpaceMedia {
  return {
    id: row.id,
    roomId: row.room_id,
    inventoryItemId: row.inventory_item_id,
    mediaType: row.media_type,
    url: toPublicUrl(row.storage_path),
    storagePath: row.storage_path,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

/** Galería de un salón, ordenada para mostrar. Pública si el salón está publicado (RLS). */
export async function listMediaForRoom(roomId: string): Promise<SpaceMedia[]> {
  const { data, error } = await supabase
    .from('space_media')
    .select(SPACE_MEDIA_COLUMNS)
    .eq('room_id', roomId)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapMediaRow(row as SpaceMediaRow));
}

function classifyAndValidate(file: File): SpaceMediaType {
  if (allowedImageTypes.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('La foto no puede pesar más de 8 MB.');
    }
    return 'photo';
  }

  if (allowedVideoTypes.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error('El video no puede pesar más de 300 MB.');
    }
    return 'video';
  }

  throw new Error('Formato no admitido. Usa JPG, PNG, WEBP para fotos o MP4/MOV para video.');
}

function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'video/quicktime') return 'mov';
  if (file.type === 'video/mp4') return 'mp4';
  return 'jpg';
}

function createUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/**
 * Sube una foto o video de un salón (o de un equipo específico de su
 * inventario) y registra la fila en space_media. Mismo contrato de
 * carpeta por usuario que services/agenda/experienceImageService.ts:
 * cada quien sube dentro de su propia carpeta (auth.uid()), exigido por
 * la política de storage.objects del bucket space-media.
 */
export async function uploadSpaceMedia(
  file: File,
  roomId: string,
  inventoryItemId?: string
): Promise<SpaceMedia> {
  const mediaType = classifyAndValidate(file);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Debes iniciar sesión para subir fotos o video.');
  }

  const extension = getFileExtension(file);
  const fileName = `${Date.now()}-${createUniqueId()}.${extension}`;
  const storagePath = `${user.id}/${roomId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(SPACE_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'No fue posible cargar el archivo.');
  }

  const { data, error } = await supabase
    .from('space_media')
    .insert({
      room_id: roomId,
      inventory_item_id: inventoryItemId ?? null,
      media_type: mediaType,
      storage_path: storagePath,
    })
    .select(SPACE_MEDIA_COLUMNS)
    .single();

  if (error) throw error;

  return mapMediaRow(data as SpaceMediaRow);
}

export async function deleteSpaceMedia(mediaId: string, storagePath: string): Promise<void> {
  const { error: dbError } = await supabase.from('space_media').delete().eq('id', mediaId);
  if (dbError) throw dbError;

  // Best-effort: si el archivo en Storage no se borra, la fila ya no
  // existe y no vuelve a aparecer en la galería.
  await supabase.storage.from(SPACE_MEDIA_BUCKET).remove([storagePath]);
}

export async function reorderSpaceMedia(mediaId: string, displayOrder: number): Promise<void> {
  const { error } = await supabase
    .from('space_media')
    .update({ display_order: displayOrder })
    .eq('id', mediaId);

  if (error) throw error;
}
