import { supabase } from '../../lib/supabase/client';

/**
 * Servicio de portafolio de actor (espacio, funder o persona), galería
 * pública con rotación diaria de 3 items, y preferencias de contacto para
 * "solicitar cotización" (correo / WhatsApp). Ver
 * specs/portafolio-productor-y-cotizacion.md.
 */

export type PortfolioActorType = 'space' | 'funder' | 'person';
export type PortfolioItemSource = 'custom' | 'project';
export type PortfolioItemStatus = 'draft' | 'published';

export interface PortfolioItem {
  id: string;
  actorType: PortfolioActorType;
  actorId: string;
  source: PortfolioItemSource;
  linkedProjectId: string | null;
  title: string;
  description: string | null;
  mediaUrls: string[];
  status: PortfolioItemStatus;
  createdAt: string;
}

interface PortfolioItemRow {
  id: string;
  actor_type: PortfolioActorType;
  actor_id: string;
  source: PortfolioItemSource;
  linked_project_id: string | null;
  title: string;
  description: string | null;
  media_urls: string[];
  status: PortfolioItemStatus;
  created_at: string;
}

export interface QuoteContactPreferences {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
}

interface QuoteContactPreferencesRow {
  quote_contact_email_enabled: boolean;
  quote_contact_whatsapp_enabled: boolean;
  quote_contact_whatsapp_number: string | null;
  public_email: string | null;
}

const PORTFOLIO_ITEM_COLUMNS =
  'id, actor_type, actor_id, source, linked_project_id, title, description, media_urls, status, created_at';

// Cada actor vive en su propia tabla — no hay una tabla "actors" única.
const ACTOR_TABLE: Record<PortfolioActorType, string> = {
  space: 'spaces',
  funder: 'funders',
  person: 'people',
};

const PORTFOLIO_MEDIA_BUCKET = 'portfolio-media';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300 MB
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/quicktime'];

function mapItemRow(row: PortfolioItemRow): PortfolioItem {
  return {
    id: row.id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    source: row.source,
    linkedProjectId: row.linked_project_id,
    title: row.title,
    description: row.description,
    mediaUrls: row.media_urls ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Gestión completa (incluye draft) para quien administra el actor.
 * La RLS ("Managers can view their portfolio items") ya filtra por
 * permiso — si el usuario no administra el actor, esto devuelve vacío
 * en vez de error.
 */
export async function listPortfolioItems(
  actorType: PortfolioActorType,
  actorId: string
): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select(PORTFOLIO_ITEM_COLUMNS)
    .eq('actor_type', actorType)
    .eq('actor_id', actorId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapItemRow(row as PortfolioItemRow));
}

/**
 * Hash determinista (no Math.random()) de un id + una clave de fecha,
 * para que la "foto del día" de la galería sea estable durante todo el
 * día y cambie al día siguiente. Mismo principio de motor puro: la fecha
 * entra como parámetro, nunca se lee internamente.
 */
function dailyGalleryHash(id: string, dateKey: string): number {
  const input = `${id}:${dateKey}`;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function todayUtcKey(referenceDate: Date = new Date()): string {
  return referenceDate.toISOString().slice(0, 10); // YYYY-MM-DD en UTC
}

/**
 * Galería pública resumida: siempre 3 items publicados (o menos si el
 * actor tiene menos de 3), los mismos durante todo el día UTC, distintos
 * al día siguiente. `referenceDate` es un parámetro explícito para poder
 * probar con fechas simuladas sin depender de Date.now() real.
 */
export async function listPublicPortfolioGallery(
  actorType: PortfolioActorType,
  actorId: string,
  referenceDate: Date = new Date()
): Promise<PortfolioItem[]> {
  const allPublished = await listPublicPortfolioGalleryAll(actorType, actorId);
  if (allPublished.length <= 3) return allPublished;

  const dateKey = todayUtcKey(referenceDate);
  const ranked = [...allPublished].sort(
    (a, b) => dailyGalleryHash(a.id, dateKey) - dailyGalleryHash(b.id, dateKey)
  );
  return ranked.slice(0, 3);
}

/** Galería pública completa (para "ver más"). Solo items publicados (RLS). */
export async function listPublicPortfolioGalleryAll(
  actorType: PortfolioActorType,
  actorId: string
): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select(PORTFOLIO_ITEM_COLUMNS)
    .eq('actor_type', actorType)
    .eq('actor_id', actorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapItemRow(row as PortfolioItemRow));
}

export interface CreatePortfolioItemInput {
  actorType: PortfolioActorType;
  actorId: string;
  title: string;
  description?: string | null;
  mediaUrls?: string[];
  status?: PortfolioItemStatus;
  source?: PortfolioItemSource;
  linkedProjectId?: string | null;
}

export async function createPortfolioItem(input: CreatePortfolioItemInput): Promise<PortfolioItem> {
  const source = input.source ?? 'custom';

  if (source === 'project' && !input.linkedProjectId) {
    throw new Error('Un item de portafolio con origen "proyecto" necesita el proyecto vinculado.');
  }
  if (source === 'custom' && input.linkedProjectId) {
    throw new Error('Un item de portafolio propio (custom) no puede tener un proyecto vinculado.');
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      actor_type: input.actorType,
      actor_id: input.actorId,
      source,
      linked_project_id: input.linkedProjectId ?? null,
      title: input.title,
      description: input.description ?? null,
      media_urls: input.mediaUrls ?? [],
      status: input.status ?? 'published',
    })
    .select(PORTFOLIO_ITEM_COLUMNS)
    .single();

  if (error) throw error;

  return mapItemRow(data as PortfolioItemRow);
}

export interface UpdatePortfolioItemInput {
  title?: string;
  description?: string | null;
  mediaUrls?: string[];
  status?: PortfolioItemStatus;
}

export async function updatePortfolioItem(
  itemId: string,
  patch: UpdatePortfolioItemInput
): Promise<PortfolioItem> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.mediaUrls !== undefined) update.media_urls = patch.mediaUrls;
  if (patch.status !== undefined) update.status = patch.status;

  const { data, error } = await supabase
    .from('portfolio_items')
    .update(update)
    .eq('id', itemId)
    .select(PORTFOLIO_ITEM_COLUMNS)
    .single();

  if (error) throw error;

  return mapItemRow(data as PortfolioItemRow);
}

export async function deletePortfolioItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('portfolio_items').delete().eq('id', itemId);
  if (error) throw error;
}

function classifyAndValidate(file: File): void {
  if (allowedImageTypes.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('La foto no puede pesar más de 8 MB.');
    }
    return;
  }
  if (allowedVideoTypes.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error('El video no puede pesar más de 300 MB.');
    }
    return;
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
 * Sube una foto o video para un item de portafolio y devuelve su URL
 * pública. El llamador la agrega al arreglo `mediaUrls` del item (con
 * createPortfolioItem/updatePortfolioItem) — esta función no toca la
 * fila de portfolio_items. Mismo patrón de carpeta-por-usuario que
 * services/spaces/spaceMediaService.ts.
 */
export async function uploadPortfolioMedia(file: File): Promise<string> {
  classifyAndValidate(file);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Debes iniciar sesión para subir fotos o video.');
  }

  const extension = getFileExtension(file);
  const fileName = `${Date.now()}-${createUniqueId()}.${extension}`;
  const storagePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'No fue posible cargar el archivo.');
  }

  const { data } = supabase.storage.from(PORTFOLIO_MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function mapPreferencesRow(row: QuoteContactPreferencesRow): QuoteContactPreferences & {
  publicEmail: string | null;
} {
  return {
    emailEnabled: row.quote_contact_email_enabled,
    whatsappEnabled: row.quote_contact_whatsapp_enabled,
    whatsappNumber: row.quote_contact_whatsapp_number,
    publicEmail: row.public_email,
  };
}

/** Preferencias de contacto para cotización, tal como las ve/edita el dueño del actor. */
export async function getQuoteContactPreferences(
  actorType: PortfolioActorType,
  actorId: string
): Promise<(QuoteContactPreferences & { publicEmail: string | null }) | null> {
  const { data, error } = await supabase
    .from(ACTOR_TABLE[actorType])
    .select('quote_contact_email_enabled, quote_contact_whatsapp_enabled, quote_contact_whatsapp_number, public_email')
    .eq('id', actorId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapPreferencesRow(data as QuoteContactPreferencesRow);
}

export async function updateQuoteContactPreferences(
  actorType: PortfolioActorType,
  actorId: string,
  prefs: QuoteContactPreferences
): Promise<void> {
  if (prefs.whatsappEnabled && !prefs.whatsappNumber) {
    throw new Error('Activa un número de WhatsApp antes de activar ese canal.');
  }

  const { error } = await supabase
    .from(ACTOR_TABLE[actorType])
    .update({
      quote_contact_email_enabled: prefs.emailEnabled,
      quote_contact_whatsapp_enabled: prefs.whatsappEnabled,
      quote_contact_whatsapp_number: prefs.whatsappNumber,
    })
    .eq('id', actorId);

  if (error) throw error;
}

/** Enlace mailto: para el botón "Solicitar cotización" (canal correo). */
export function buildQuoteEmailHref(email: string, actorName: string): string {
  const subject = encodeURIComponent(`Solicitud de cotización — ${actorName}`);
  return `mailto:${email}?subject=${subject}`;
}

/** Enlace wa.me para el botón "Solicitar cotización" (canal WhatsApp). */
export function buildQuoteWhatsappHref(whatsappNumber: string, actorName: string): string {
  const digitsOnly = whatsappNumber.replace(/[^\d]/g, '');
  const message = encodeURIComponent(`Hola, quiero solicitar una cotización a ${actorName}.`);
  return `https://wa.me/${digitsOnly}?text=${message}`;
}
