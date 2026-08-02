import { supabase } from '@/lib/supabase/client';
import type { EditorialBodyBlock, EditorialMediaAsset, EditorialPost, EditorialPostStatus, EditorialPostType, HomepageSection } from '@/types/editorial';

const POST_FIELDS = 'id,slug,post_type,title,excerpt,body_blocks,cover_image_url,cover_image_alt,cover_caption,credits,byline,category,tags,location,related_project_id,status,seo_title,seo_description,share_title,share_description,share_image_url,is_sponsored,sponsor_label,sponsorship_disclosure,publish_at,published_at,created_at,updated_at';
const HOME_FIELDS = 'id,logical_id,block_type,title,subtitle,description,cta_label,cta_url,image_url,related_post_id,related_project_id,variant,position,is_visible,version_status';
const db = () => supabase as any;

export async function listEditorialPosts(): Promise<EditorialPost[]> {
  const { data, error } = await db().from('editorial_posts').select(POST_FIELDS).order('updated_at', { ascending: false });
  if (error) throw new Error(error.message || 'No fue posible cargar las publicaciones.');
  return (data ?? []).map(mapPost);
}
export async function loadEditorialPost(id: string): Promise<EditorialPost> {
  const { data, error } = await db().from('editorial_posts').select(POST_FIELDS).eq('id', id).single();
  if (error || !data) throw new Error(error?.message || 'No fue posible cargar la publicación.');
  return mapPost(data);
}
export async function saveEditorialPost(input: Partial<EditorialPost> & { id?: string; title: string }): Promise<EditorialPost> {
  const payload = {
    slug: input.slug || normalizeSlug(input.title), post_type: input.postType ?? 'article', title: input.title.trim(), excerpt: input.excerpt?.trim() ?? '',
    body_blocks: input.bodyBlocks ?? [], cover_image_url: input.coverImageUrl || null, cover_image_alt: input.coverImageAlt || null,
    cover_caption: input.coverCaption || null, credits: input.credits ?? '', byline: input.byline ?? 'Cultura Está', category: input.category ?? '', tags: input.tags ?? [],
    location: input.location || null, related_project_id: input.relatedProjectId || null, status: input.status ?? 'draft', seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null, share_title: input.shareTitle || null, share_description: input.shareDescription || null,
    share_image_url: input.shareImageUrl || null, is_sponsored: input.isSponsored ?? false, sponsor_label: input.sponsorLabel || null,
    sponsorship_disclosure: input.sponsorshipDisclosure || null, publish_at: input.publishAt || null,
  };
  const query = input.id ? db().from('editorial_posts').update(payload).eq('id', input.id) : db().from('editorial_posts').insert(payload);
  const { data, error } = await query.select(POST_FIELDS).single();
  if (error || !data) throw new Error(error?.message || 'No fue posible guardar la publicación.');
  return mapPost(data);
}
export async function loadHomepageSections(): Promise<HomepageSection[]> {
  const { data, error } = await db().from('homepage_sections').select(HOME_FIELDS).order('position');
  if (error) throw new Error(error.message || 'No fue posible cargar la portada.');
  return (data ?? []).map(mapSection);
}
export async function saveHomepageSection(section: Partial<HomepageSection> & { blockType: HomepageSection['blockType'] }) {
  const payload = { block_type: section.blockType, title: section.title ?? '', subtitle: section.subtitle ?? '', description: section.description ?? '', cta_label: section.ctaLabel || null, cta_url: section.ctaUrl || null, image_url: section.imageUrl || null, related_post_id: section.relatedPostId || null, related_project_id: section.relatedProjectId || null, variant: section.variant ?? 'default', position: section.position ?? 0, is_visible: section.isVisible ?? true, version_status: section.versionStatus ?? 'draft' };
  const query = section.id ? db().from('homepage_sections').update(payload).eq('id', section.id) : db().from('homepage_sections').insert(payload);
  const { data, error } = await query.select(HOME_FIELDS).single();
  if (error) throw new Error(error.message); return mapSection(data);
}
export async function deleteHomepageSection(id: string) { const { error } = await db().from('homepage_sections').delete().eq('id', id); if (error) throw new Error(error.message); }
export async function createHomepageDraft(id:string):Promise<string>{const{data,error}=await db().rpc('create_homepage_section_draft',{source_section_id:id});if(error)throw new Error(error.message);return data;}
export async function publishHomepageDraft(id:string):Promise<string>{const{data,error}=await db().rpc('publish_homepage_section_draft',{draft_section_id:id});if(error)throw new Error(error.message);return data;}
export async function createEditorialDraftFromProject(projectId:string):Promise<string>{const{data,error}=await db().rpc('create_editorial_draft_from_project',{target_project_id:projectId});if(error)throw new Error(error.message);return data;}
export async function uploadEditorialMedia(file: File, metadata: { altText: string; credit: string; description: string }): Promise<EditorialMediaAsset> {
  if (!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type)) throw new Error('Usa JPG, PNG, WebP, MP4 o WebM.');
  const maxSize = file.type.startsWith('video/') ? 100 : 10;
  if (file.size > maxSize * 1024 * 1024) throw new Error(`El archivo supera el máximo de ${maxSize} MB.`);
  const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Debes iniciar sesión.');
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'; const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('editorial-media').upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);
  const { data: urlData } = supabase.storage.from('editorial-media').getPublicUrl(path);
  const { data, error } = await db().from('editorial_media_assets').insert({ storage_path: path, public_url: urlData.publicUrl, file_name: file.name, mime_type: file.type, size_bytes: file.size, alt_text: metadata.altText.trim(), credit: metadata.credit.trim(), description: metadata.description.trim() }).select('*').single();
  if (error) throw new Error(error.message); return mapMedia(data);
}
export const uploadEditorialImage = uploadEditorialMedia;
export async function listEditorialMedia(): Promise<EditorialMediaAsset[]> { const { data, error } = await db().from('editorial_media_assets').select('*').order('created_at', { ascending: false }); if (error) throw new Error(error.message); return (data ?? []).map(mapMedia); }
export function normalizeSlug(value: string) { return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function mapPost(r: any): EditorialPost { return { id:r.id,slug:r.slug,postType:r.post_type as EditorialPostType,title:r.title,excerpt:r.excerpt,bodyBlocks:(r.body_blocks??[]) as EditorialBodyBlock[],coverImageUrl:r.cover_image_url??'',coverImageAlt:r.cover_image_alt??'',coverCaption:r.cover_caption??'',credits:r.credits??'',byline:r.byline??'',category:r.category??'',tags:r.tags??[],location:r.location??'',relatedProjectId:r.related_project_id,status:r.status as EditorialPostStatus,seoTitle:r.seo_title??'',seoDescription:r.seo_description??'',shareTitle:r.share_title??'',shareDescription:r.share_description??'',shareImageUrl:r.share_image_url??'',isSponsored:Boolean(r.is_sponsored),sponsorLabel:r.sponsor_label??'',sponsorshipDisclosure:r.sponsorship_disclosure??'',publishAt:r.publish_at??'',publishedAt:r.published_at,createdAt:r.created_at,updatedAt:r.updated_at }; }
function mapSection(r:any):HomepageSection{return{id:r.id,logicalId:r.logical_id,blockType:r.block_type,title:r.title,subtitle:r.subtitle,description:r.description,ctaLabel:r.cta_label??'',ctaUrl:r.cta_url??'',imageUrl:r.image_url??'',relatedPostId:r.related_post_id,relatedProjectId:r.related_project_id,variant:r.variant,position:r.position,isVisible:r.is_visible,versionStatus:r.version_status};}
function mapMedia(r:any):EditorialMediaAsset{return{id:r.id,publicUrl:r.public_url,storagePath:r.storage_path,fileName:r.file_name,mimeType:r.mime_type,sizeBytes:r.size_bytes,altText:r.alt_text,credit:r.credit,description:r.description,createdAt:r.created_at};}
