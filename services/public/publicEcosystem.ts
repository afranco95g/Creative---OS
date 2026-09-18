import {
  createClient,
} from '../../lib/supabase/server';

export type PublicActorType =
  | 'person'
  | 'space'
  | 'funder';

export interface PublicEcosystemActor {
  actorType: PublicActorType;
  actorId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  imageUrl: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  labels: string[];
  offers: string[];
  interests: string[];
  verified: boolean;
  featured: boolean;
  /** Solo para actor_type = 'space'. URL pública ya resuelta (bucket space-media). */
  heroImageUrl: string | null;
  /** Solo para actor_type = 'space'. Texto libre para la caja superpuesta a heroImageUrl. */
  heroInfo: string | null;
  /** Solo para actor_type = 'space'. URL pública ya resuelta (bucket space-media). imageUrl sigue null para espacios. */
  logoUrl: string | null;
}

export interface PublicActorProject {
  projectId: string;
  slug: string;
  headline: string;
  summary: string;
  coverImageUrl: string | null;
  city: string | null;
  category: string;
  relationshipLabel: string;
  publishedAt: string | null;
}

interface PublicEcosystemActorRow {
  actor_type: PublicActorType;
  actor_id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  image_url: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  labels: string[] | null;
  offers: string[] | null;
  interests: string[] | null;
  verified: boolean | null;
  featured: boolean | null;
  hero_image_path: string | null;
  hero_info: string | null;
  logo_image_path: string | null;
}

const SPACE_MEDIA_BUCKET = 'space-media';

interface PublicActorProjectRow {
  project_id: string;
  slug: string;
  headline: string;
  summary: string;
  cover_image_url: string | null;
  city: string | null;
  category: string;
  relationship_label: string;
  published_at: string | null;
}

export async function listPublishedEcosystemActors():
  Promise<PublicEcosystemActor[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'list_published_ecosystem_actors'
  );

  if (error) {
    console.error(
      'Error loading public ecosystem:',
      error
    );

    throw new Error(
      'No fue posible cargar el ecosistema público.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicEcosystemActorRow[];

  return rows.map(
    (row) => mapPublicActor(row, supabase)
  );
}

export async function getPublishedEcosystemActor(
  actorType: PublicActorType,
  slug: string
): Promise<PublicEcosystemActor | null> {
  const cleanSlug =
    slug.trim();

  if (!cleanSlug) {
    return null;
  }

  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_published_ecosystem_actor',
    {
      target_actor_type:
        actorType,

      target_slug:
        cleanSlug,
    }
  );

  if (error) {
    console.error(
      'Error loading public actor:',
      error
    );

    throw new Error(
      'No fue posible cargar el perfil público.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicEcosystemActorRow[];

  return rows[0]
    ? mapPublicActor(rows[0], supabase)
    : null;
}

export async function getPublishedActorProjects(
  actorType: PublicActorType,
  actorId: string
): Promise<PublicActorProject[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_published_actor_projects',
    {
      target_actor_type:
        actorType,

      target_actor_id:
        actorId,
    }
  );

  if (error) {
    console.error(
      'Error loading actor projects:',
      error
    );

    throw new Error(
      'No fue posible cargar los proyectos relacionados.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicActorProjectRow[];

  return rows.map(
    (row) => ({
      projectId:
        row.project_id,

      slug:
        row.slug,

      headline:
        row.headline,

      summary:
        row.summary,

      coverImageUrl:
        row.cover_image_url,

      city:
        row.city,

      category:
        row.category,

      relationshipLabel:
        row.relationship_label,

      publishedAt:
        row.published_at,
    })
  );
}

export function getPublicActorHref(
  actor:
    Pick<
      PublicEcosystemActor,
      'actorType' | 'slug'
    >
): string {
  const pathByType:
    Record<
      PublicActorType,
      string
    > = {
      person:
        'personas',

      space:
        'espacios',

      funder:
        'financiadores',
    };

  return `/ecosistema/${
    pathByType[
      actor.actorType
    ]
  }/${actor.slug}`;
}

function mapPublicActor(
  row: PublicEcosystemActorRow,
  supabase: Awaited<ReturnType<typeof createClient>>
): PublicEcosystemActor {
  const heroImageUrl =
    row.hero_image_path
      ? supabase.storage
          .from(SPACE_MEDIA_BUCKET)
          .getPublicUrl(row.hero_image_path).data.publicUrl
      : null;

  const logoUrl =
    row.logo_image_path
      ? supabase.storage
          .from(SPACE_MEDIA_BUCKET)
          .getPublicUrl(row.logo_image_path).data.publicUrl
      : null;

  return {
    actorType:
      row.actor_type,

    actorId:
      row.actor_id,

    name:
      row.name,

    slug:
      row.slug,

    headline:
      row.headline,

    description:
      row.description,

    imageUrl:
      row.image_url,

    city:
      row.city,

    department:
      row.department,

    country:
      row.country,

    labels:
      Array.isArray(
        row.labels
      )
        ? row.labels
        : [],

    offers:
      Array.isArray(
        row.offers
      )
        ? row.offers
        : [],

    interests:
      Array.isArray(
        row.interests
      )
        ? row.interests
        : [],

    verified:
      Boolean(
        row.verified
      ),

    featured:
      Boolean(
        row.featured
      ),

    heroImageUrl,

    heroInfo:
      row.hero_info,

    logoUrl,
  };
}
// ============================================================
// Portafolio público (galería con rotación diaria de 3 items) y
// preferencias de contacto para "solicitar cotización". Ver
// specs/portafolio-productor-y-cotizacion.md.
// ============================================================

export interface PublicPortfolioItem {
  id: string;
  title: string;
  description: string | null;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'audio' | 'document';
}

interface PublicPortfolioItemRow {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[];
  media_type: 'image' | 'video' | 'audio' | 'document';
}

function mapPublicPortfolioItem(row: PublicPortfolioItemRow): PublicPortfolioItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    mediaUrls: row.media_urls ?? [],
    mediaType: row.media_type ?? 'image',
  };
}

// Mismo hash determinista que services/ecosystem/portfolioService.ts
// (duplicado a propósito para no acoplar este archivo de servidor al
// cliente de supabase del navegador que importa ese otro módulo). Si se
// cambia uno, se debe cambiar el otro.
function dailyGalleryHash(id: string, dateKey: string): number {
  const input = `${id}:${dateKey}`;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function todayUtcKey(referenceDate: Date): string {
  return referenceDate.toISOString().slice(0, 10);
}

/** Galería pública completa (publicados), para "ver galería completa". */
export async function getPublicPortfolioGalleryAll(
  actorType: PublicActorType,
  actorId: string
): Promise<PublicPortfolioItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('portfolio_items')
    .select('id, title, description, media_urls, media_type')
    .eq('actor_type', actorType)
    .eq('actor_id', actorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading portfolio gallery:', error);
    throw new Error('No fue posible cargar la galería.');
  }

  return ((data ?? []) as PublicPortfolioItemRow[]).map(mapPublicPortfolioItem);
}

/**
 * Galería pública resumida: 3 items publicados, estables durante todo
 * el día UTC (rotación determinista, no Math.random()), distintos al
 * día siguiente.
 */
export async function getPublicPortfolioGallery(
  actorType: PublicActorType,
  actorId: string,
  referenceDate: Date = new Date()
): Promise<PublicPortfolioItem[]> {
  const all = await getPublicPortfolioGalleryAll(actorType, actorId);
  if (all.length <= 3) return all;

  const dateKey = todayUtcKey(referenceDate);
  const ranked = [...all].sort(
    (a, b) => dailyGalleryHash(a.id, dateKey) - dailyGalleryHash(b.id, dateKey)
  );
  return ranked.slice(0, 3);
}

export interface PublicQuoteContactInfo {
  emailEnabled: boolean;
  email: string | null;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
}

interface PublicQuoteContactInfoRow {
  quote_contact_email_enabled: boolean;
  quote_contact_whatsapp_enabled: boolean;
  quote_contact_whatsapp_number: string | null;
  public_email: string | null;
}

const PUBLIC_ACTOR_TABLE: Record<PublicActorType, string> = {
  space: 'spaces',
  funder: 'funders',
  person: 'people',
};

/** Canales de contacto activos del actor, para el botón "Solicitar cotización". */
export async function getPublicQuoteContactInfo(
  actorType: PublicActorType,
  actorId: string
): Promise<PublicQuoteContactInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(PUBLIC_ACTOR_TABLE[actorType])
    .select('quote_contact_email_enabled, quote_contact_whatsapp_enabled, quote_contact_whatsapp_number, public_email')
    .eq('id', actorId)
    .maybeSingle();

  if (error) {
    console.error('Error loading quote contact info:', error);
    return null;
  }
  if (!data) return null;

  const row = data as PublicQuoteContactInfoRow;
  return {
    emailEnabled: row.quote_contact_email_enabled && Boolean(row.public_email),
    email: row.public_email,
    whatsappEnabled: row.quote_contact_whatsapp_enabled && Boolean(row.quote_contact_whatsapp_number),
    whatsappNumber: row.quote_contact_whatsapp_number,
  };
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
