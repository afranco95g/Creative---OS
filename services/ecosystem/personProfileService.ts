import { supabase } from '@/lib/supabase/client';

export interface PersonProfileInput {
  fullName: string;
  headline: string;
  biography: string;
  avatarUrl: string;
  city: string;
  department: string;
  country: string;
  roles: string[];
  skills: string[];
  interests: string[];
  websiteUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  publicEmail: string;
}

// Vocabulario cerrado de habilidades de producción. Mismo patrón que
// service_categories (funders/spaces) y que el constraint ya existente de
// people.roles — ver database/049_people_skills_vocabulario_cerrado.sql y
// specs/skills-personas-vocabulario-cerrado.md.
export const PERSON_SKILLS = [
  ['direccion_audiovisual', 'Dirección'],
  ['produccion_ejecutiva', 'Producción ejecutiva'],
  ['produccion_de_campo', 'Producción de campo'],
  ['asistencia_de_direccion', 'Asistencia de dirección'],
  ['direccion_de_fotografia', 'Dirección de fotografía'],
  ['camara_videografia', 'Cámara / realización audiovisual'],
  ['fotografia', 'Fotografía'],
  ['edicion_audiovisual', 'Edición audiovisual'],
  ['colorizacion', 'Colorización'],
  ['direccion_de_arte', 'Dirección de arte'],
  ['vestuario', 'Vestuario'],
  ['maquillaje_caracterizacion', 'Maquillaje / caracterización'],
  ['sonido_directo', 'Sonido directo'],
  ['diseno_sonoro_postproduccion', 'Diseño sonoro / postproducción de audio'],
  ['iluminacion_gaffer', 'Iluminación / gaffer'],
  ['produccion_musical', 'Producción musical'],
  ['masterizacion_mezcla', 'Masterización y mezcla'],
  ['ingenieria_sonido_en_vivo', 'Ingeniería de sonido en vivo'],
  ['composicion_arreglos', 'Composición y arreglos'],
  ['tour_management', 'Tour management'],
  ['produccion_de_eventos', 'Producción de eventos'],
  ['logistica_de_eventos', 'Logística de eventos'],
  ['jefatura_tecnica_eventos', 'Jefatura técnica de eventos'],
  ['gestion_cultural_comunitaria', 'Gestión cultural comunitaria'],
  ['mediacion_cultural', 'Mediación cultural'],
  ['investigacion_territorial', 'Investigación territorial'],
  ['curaduria', 'Curaduría'],
  ['diseno_grafico', 'Diseño gráfico'],
  ['ilustracion', 'Ilustración'],
  ['produccion_de_merch', 'Producción de merch'],
] as const;

const PERSON_SKILL_KEYS = new Set<string>(PERSON_SKILLS.map(([key]) => key));

// Defensa en profundidad: el constraint de la base
// (people_skills_vocab_check) es la fuente de verdad; esto solo evita un
// error de guardado innecesario si algo manda un valor fuera del
// vocabulario.
export function sanitizeSkills(values: string[]) {
  return [...new Set(values.filter((value) => PERSON_SKILL_KEYS.has(value)))];
}

export async function updateMyPersonProfile(personId: string, input: PersonProfileInput, submitForReview = false) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Debes iniciar sesión para editar tu perfil.');
  const payload = {
    full_name: input.fullName.trim(), headline: nullable(input.headline), biography: nullable(input.biography),
    avatar_url: nullable(input.avatarUrl), city: nullable(input.city), department: nullable(input.department),
    country: input.country.trim() || 'Colombia', roles: cleanList(input.roles), skills: sanitizeSkills(input.skills),
    interests: cleanList(input.interests), website_url: nullable(input.websiteUrl), instagram_url: nullable(input.instagramUrl),
    youtube_url: nullable(input.youtubeUrl), linkedin_url: nullable(input.linkedinUrl), public_email: nullable(input.publicEmail),
    ...(submitForReview ? { status: 'review' } : {}),
  };
  const database = supabase;
  const [{ data, error }, { error: profileError }] = await Promise.all([
    database.from('people').update(payload).eq('id', personId).eq('profile_id', user.id).select('id, full_name, headline, biography, avatar_url, city, department, country, roles, skills, interests, website_url, instagram_url, youtube_url, linkedin_url, public_email, verified, featured, status').single(),
    database.from('profiles').update({ full_name: input.fullName.trim() }).eq('id', user.id),
  ]);
  if (error) throw new Error(error.message || 'No fue posible guardar el perfil.');
  if (profileError) console.warn('No se actualizó el nombre de la cuenta:', profileError.message);
  return data;
}

function nullable(value: string) { return value.trim() || null; }
function cleanList(values: string[]) { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
