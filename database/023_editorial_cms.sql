begin;

create table if not exists public.editorial_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  post_type text not null default 'article' check (post_type in (
    'news','article','interview','profile','chronicle','review','guide','agenda',
    'featured_project','featured_space','featured_artist','call','opinion','sponsored','other'
  )),
  title text not null default '',
  excerpt text not null default '',
  body_blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(body_blocks) = 'array'),
  cover_image_url text,
  cover_image_alt text,
  cover_caption text,
  credits text not null default '',
  byline text not null default 'Cultura Está',
  category text not null default '',
  tags text[] not null default '{}',
  location text,
  event_at timestamptz,
  related_project_id uuid references public.projects(id) on delete set null,
  related_actor_type text check (related_actor_type is null or related_actor_type in ('person','space','funder')),
  related_actor_id uuid,
  related_experience_id uuid references public.experiences(id) on delete set null,
  external_links jsonb not null default '[]'::jsonb check (jsonb_typeof(external_links) = 'array'),
  status text not null default 'draft' check (status in (
    'draft','in_review','scheduled','published','rejected','unpublished','archived'
  )),
  seo_title text,
  seo_description text,
  share_title text,
  share_description text,
  share_image_url text,
  is_sponsored boolean not null default false,
  sponsor_actor_id uuid,
  sponsor_label text,
  sponsorship_disclosure text,
  publish_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_posts_public_idx on public.editorial_posts(status, publish_at desc);
create index if not exists editorial_posts_project_idx on public.editorial_posts(related_project_id);
create index if not exists editorial_posts_tags_idx on public.editorial_posts using gin(tags);

create table if not exists public.editorial_media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  width integer,
  height integer,
  alt_text text not null default '',
  credit text not null default '',
  description text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  logical_id uuid not null default gen_random_uuid(),
  block_type text not null check (block_type in (
    'hero','featured_articles','latest_posts','featured_project','featured_actor',
    'agenda','gallery','editorial_text','quote','video','banner','calls','newsletter','sponsored_feature'
  )),
  title text not null default '',
  subtitle text not null default '',
  description text not null default '',
  cta_label text,
  cta_url text,
  image_url text,
  video_url text,
  related_post_id uuid references public.editorial_posts(id) on delete set null,
  related_project_id uuid references public.projects(id) on delete set null,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  variant text not null default 'default' check (variant in ('default','compact','feature','grid','full_bleed')),
  position integer not null default 0,
  is_visible boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  version_status text not null default 'draft' check (version_status in ('draft','published')),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index if not exists homepage_sections_version_idx
  on public.homepage_sections(logical_id, version_status);

create index if not exists homepage_sections_render_idx
  on public.homepage_sections(version_status, is_visible, position);

alter table public.editorial_posts enable row level security;
alter table public.editorial_media_assets enable row level security;
alter table public.homepage_sections enable row level security;

create or replace function public.enforce_editorial_post_permissions()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare role_name text := coalesce(public.current_profile_role(), 'anonymous');
begin
  if role_name not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos editoriales'; end if;
  if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  if new.status in ('published','scheduled') and role_name not in ('media_admin','super_admin') then
    raise exception 'Solo un administrador del medio puede publicar o programar';
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if nullif(trim(new.title),'') is null or nullif(trim(new.excerpt),'') is null or
       nullif(trim(coalesce(new.cover_image_alt,'')),'') is null then
      raise exception 'Título, resumen y texto alternativo son obligatorios para publicar';
    end if;
    new.published_at := coalesce(new.published_at, now());
    new.publish_at := coalesce(new.publish_at, now());
    new.published_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists editorial_posts_permissions on public.editorial_posts;
create trigger editorial_posts_permissions before insert or update on public.editorial_posts
for each row execute function public.enforce_editorial_post_permissions();

create or replace function public.enforce_homepage_permissions()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('media_admin','super_admin') then raise exception 'Sin permisos para administrar la portada'; end if;
  if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
  new.updated_by := auth.uid(); new.updated_at := now();
  if new.version_status = 'published' then
    new.published_by := auth.uid(); new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists homepage_sections_permissions on public.homepage_sections;
create trigger homepage_sections_permissions before insert or update on public.homepage_sections
for each row execute function public.enforce_homepage_permissions();

create policy "Public reads published editorial posts" on public.editorial_posts for select to anon, authenticated
using ((status = 'published' and coalesce(publish_at, published_at, now()) <= now()) or
       (status = 'scheduled' and publish_at <= now()));
create policy "Editorial team reads posts" on public.editorial_posts for select to authenticated
using (public.current_profile_role() in ('journalist','media_admin','super_admin'));
create policy "Editorial team creates posts" on public.editorial_posts for insert to authenticated
with check (public.current_profile_role() in ('journalist','media_admin','super_admin'));
create policy "Editorial team updates posts" on public.editorial_posts for update to authenticated
using (public.current_profile_role() in ('journalist','media_admin','super_admin'))
with check (public.current_profile_role() in ('journalist','media_admin','super_admin'));

create policy "Editorial team reads media" on public.editorial_media_assets for select to authenticated
using (public.current_profile_role() in ('journalist','media_admin','super_admin'));
create policy "Editorial team creates media" on public.editorial_media_assets for insert to authenticated
with check (public.current_profile_role() in ('journalist','media_admin','super_admin'));
create policy "Editorial admins update media" on public.editorial_media_assets for update to authenticated
using (public.current_profile_role() in ('media_admin','super_admin'));
create policy "Editorial admins delete unused media" on public.editorial_media_assets for delete to authenticated
using (public.current_profile_role() in ('media_admin','super_admin') and
  not exists (select 1 from public.editorial_posts p where p.cover_image_url = editorial_media_assets.public_url or p.share_image_url = editorial_media_assets.public_url) and
  not exists (select 1 from public.homepage_sections h where h.image_url = editorial_media_assets.public_url));

create policy "Public reads published homepage" on public.homepage_sections for select to anon, authenticated
using (version_status = 'published' and is_visible and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Editorial team previews homepage" on public.homepage_sections for select to authenticated
using (public.current_profile_role() in ('journalist','media_admin','super_admin'));
create policy "Editorial admins create homepage" on public.homepage_sections for insert to authenticated
with check (public.current_profile_role() in ('media_admin','super_admin'));
create policy "Editorial admins update homepage" on public.homepage_sections for update to authenticated
using (public.current_profile_role() in ('media_admin','super_admin'));
create policy "Editorial admins delete homepage" on public.homepage_sections for delete to authenticated
using (public.current_profile_role() in ('media_admin','super_admin'));

create or replace function public.create_editorial_draft_from_project(target_project_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare source record; new_post_id uuid;
begin
  if public.current_profile_role() not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos editoriales'; end if;
  select id,title,description,category into source from public.projects
  where id=target_project_id and workflow_status in ('submitted_to_media','editorial_review','published');
  if not found then raise exception 'Proyecto no disponible para el medio'; end if;
  select id into new_post_id from public.editorial_posts where related_project_id=target_project_id and status not in ('archived');
  if new_post_id is not null then return new_post_id; end if;
  insert into public.editorial_posts(slug,post_type,title,excerpt,category,related_project_id,status,created_by,updated_by)
  values(public.make_unique_slug(source.title),'featured_project',source.title,source.description,source.category,source.id,'draft',auth.uid(),auth.uid())
  returning id into new_post_id;
  return new_post_id;
end;$$;

create or replace function public.create_homepage_section_draft(source_section_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare source public.homepage_sections%rowtype; draft_id uuid;
begin
  if public.current_profile_role() not in ('media_admin','super_admin') then raise exception 'Sin permisos'; end if;
  select * into source from public.homepage_sections where id=source_section_id and version_status='published';
  if not found then raise exception 'Sección no encontrada'; end if;
  insert into public.homepage_sections(logical_id,block_type,title,subtitle,description,cta_label,cta_url,image_url,video_url,related_post_id,related_project_id,settings,variant,position,is_visible,starts_at,ends_at,version_status,created_by,updated_by)
  values(source.logical_id,source.block_type,source.title,source.subtitle,source.description,source.cta_label,source.cta_url,source.image_url,source.video_url,source.related_post_id,source.related_project_id,source.settings,source.variant,source.position,source.is_visible,source.starts_at,source.ends_at,'draft',auth.uid(),auth.uid())
  on conflict(logical_id,version_status) do update set updated_at=now() returning id into draft_id;
  return draft_id;
end;$$;

create or replace function public.publish_homepage_section_draft(draft_section_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare draft public.homepage_sections%rowtype; published_id uuid;
begin
  if public.current_profile_role() not in ('media_admin','super_admin') then raise exception 'Sin permisos'; end if;
  select * into draft from public.homepage_sections where id=draft_section_id and version_status='draft';
  if not found then raise exception 'Borrador no encontrado'; end if;
  delete from public.homepage_sections where logical_id=draft.logical_id and version_status='published';
  update public.homepage_sections set version_status='published',published_by=auth.uid(),published_at=now(),updated_by=auth.uid(),updated_at=now()
  where id=draft_section_id returning id into published_id;
  return published_id;
end;$$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('editorial-media','editorial-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Public reads editorial media" on storage.objects for select to public using (bucket_id='editorial-media');
create policy "Editorial team uploads media" on storage.objects for insert to authenticated
with check (bucket_id='editorial-media' and public.current_profile_role() in ('journalist','media_admin','super_admin'));
create policy "Editorial admins manage media files" on storage.objects for update to authenticated
using (bucket_id='editorial-media' and public.current_profile_role() in ('media_admin','super_admin'));
create policy "Editorial admins delete media files" on storage.objects for delete to authenticated
using (bucket_id='editorial-media' and public.current_profile_role() in ('media_admin','super_admin'));

grant select on public.editorial_posts, public.homepage_sections to anon, authenticated;
grant insert,update on public.editorial_posts to authenticated;
grant select,insert,update,delete on public.editorial_media_assets, public.homepage_sections to authenticated;
revoke all on function public.create_homepage_section_draft(uuid) from public;
revoke all on function public.publish_homepage_section_draft(uuid) from public;
revoke all on function public.create_editorial_draft_from_project(uuid) from public;
grant execute on function public.create_homepage_section_draft(uuid), public.publish_homepage_section_draft(uuid), public.create_editorial_draft_from_project(uuid) to authenticated;

commit;
