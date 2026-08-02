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

export async function updateMyPersonProfile(personId: string, input: PersonProfileInput, submitForReview = false) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Debes iniciar sesión para editar tu perfil.');
  const payload = {
    full_name: input.fullName.trim(), headline: nullable(input.headline), biography: nullable(input.biography),
    avatar_url: nullable(input.avatarUrl), city: nullable(input.city), department: nullable(input.department),
    country: input.country.trim() || 'Colombia', roles: cleanList(input.roles), skills: cleanList(input.skills),
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
