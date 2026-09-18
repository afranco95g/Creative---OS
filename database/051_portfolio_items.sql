-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 051
-- Portafolio de productor, galería pública y preferencias de
-- contacto para "solicitar cotización" (correo / WhatsApp).
-- Ver specs/portafolio-productor-y-cotizacion.md
-- ============================================================

begin;

-- ============================================================
-- 1. PREFERENCIAS DE CONTACTO PARA COTIZACIÓN
-- ============================================================
-- El correo reutiliza public_email (ya existe en las tres
-- tablas de actor) — no se duplica.

alter table public.spaces
  add column if not exists quote_contact_email_enabled boolean not null default false,
  add column if not exists quote_contact_whatsapp_enabled boolean not null default false,
  add column if not exists quote_contact_whatsapp_number text;

alter table public.funders
  add column if not exists quote_contact_email_enabled boolean not null default false,
  add column if not exists quote_contact_whatsapp_enabled boolean not null default false,
  add column if not exists quote_contact_whatsapp_number text;

alter table public.people
  add column if not exists quote_contact_email_enabled boolean not null default false,
  add column if not exists quote_contact_whatsapp_enabled boolean not null default false,
  add column if not exists quote_contact_whatsapp_number text;

-- ============================================================
-- 2. FUNCIÓN DE PERMISOS COMPARTIDA
-- ============================================================
-- Un único punto de verdad para "¿este perfil administra este
-- actor?", usado por las políticas de portfolio_items en vez de
-- repetir el case space/funder/person en cada policy. Reutiliza
-- exactamente los mismos criterios ya vigentes:
--   - spaces: public.can_manage_space() (definida en 045)
--   - funders: mismo predicado de "Managers can update funders"
--     en 003 (owner/administrator en funder_memberships, activo)
--   - people: profile_id = auth.uid() (dueño de su propio perfil)
-- En los tres casos, ecosystem_admin/super_admin también pueden.

create or replace function public.can_manage_actor(
  target_actor_type text,
  target_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case target_actor_type
    when 'space' then public.can_manage_space(target_actor_id)
    when 'funder' then (
      public.current_profile_role() in ('ecosystem_admin', 'super_admin')
      or exists (
        select 1
        from public.funder_memberships
        where funder_memberships.funder_id = target_actor_id
          and funder_memberships.profile_id = auth.uid()
          and funder_memberships.status = 'active'
          and funder_memberships.role in ('owner', 'administrator')
      )
    )
    when 'person' then (
      public.current_profile_role() in ('ecosystem_admin', 'super_admin')
      or exists (
        select 1
        from public.people
        where people.id = target_actor_id
          and people.profile_id = auth.uid()
      )
    )
    else false
  end;
$$;

revoke all on function public.can_manage_actor(text, uuid) from public;
grant execute on function public.can_manage_actor(text, uuid) to authenticated;

-- ============================================================
-- 3. TABLA portfolio_items
-- ============================================================

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),

  actor_type text not null
    check (actor_type in ('space', 'funder', 'person')),

  actor_id uuid not null,

  source text not null default 'custom'
    check (source in ('custom', 'project')),

  linked_project_id uuid
    references public.projects(id)
    on delete set null,

  title text not null,

  description text,

  media_urls text[] not null default '{}',

  status text not null default 'published'
    check (status in ('draft', 'published')),

  created_at timestamptz not null default now(),

  -- Coherencia source <-> linked_project_id: un item 'project'
  -- siempre debe apuntar a un proyecto; un item 'custom' nunca.
  constraint portfolio_items_source_linked_project_check
    check (
      (source = 'project' and linked_project_id is not null)
      or (source = 'custom' and linked_project_id is null)
    )
);

create index if not exists portfolio_items_actor_idx
on public.portfolio_items(actor_type, actor_id);

create index if not exists portfolio_items_status_idx
on public.portfolio_items(status);

alter table public.portfolio_items
enable row level security;

-- Lectura pública: solo items publicados, y solo si el actor
-- dueño también está publicado (mismo criterio que ya usan las
-- políticas "Public can view published spaces/funders", y el
-- equivalente para people con status = 'published').
create policy "Public can view published portfolio items"
on public.portfolio_items
for select
to anon, authenticated
using (
  status = 'published'
  and (
    (actor_type = 'space' and exists (
      select 1 from public.spaces
      where spaces.id = portfolio_items.actor_id
        and spaces.status = 'published'
    ))
    or (actor_type = 'funder' and exists (
      select 1 from public.funders
      where funders.id = portfolio_items.actor_id
        and funders.status = 'published'
    ))
    or (actor_type = 'person' and exists (
      select 1 from public.people
      where people.id = portfolio_items.actor_id
        and people.status = 'published'
    ))
  )
);

-- Gestión: solo quien administra ese actor puede ver (incluye
-- draft), crear, editar y borrar sus propios items.
create policy "Managers can view their portfolio items"
on public.portfolio_items
for select
to authenticated
using (
  public.can_manage_actor(actor_type, actor_id)
);

create policy "Managers can create portfolio items"
on public.portfolio_items
for insert
to authenticated
with check (
  public.can_manage_actor(actor_type, actor_id)
);

create policy "Managers can update portfolio items"
on public.portfolio_items
for update
to authenticated
using (
  public.can_manage_actor(actor_type, actor_id)
)
with check (
  public.can_manage_actor(actor_type, actor_id)
);

create policy "Managers can delete portfolio items"
on public.portfolio_items
for delete
to authenticated
using (
  public.can_manage_actor(actor_type, actor_id)
);
-- ============================================================
-- 4. STORAGE: BUCKET DE MEDIOS DEL PORTAFOLIO (portfolio-media)
-- ============================================================
-- Mismo patron que space-media (045): bucket publico de lectura,
-- escritura solo en la carpeta del propio usuario autenticado.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  314572800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media" on storage.objects
for select to public
using (bucket_id = 'portfolio-media');

drop policy if exists "Users upload portfolio media" on storage.objects;
create policy "Users upload portfolio media" on storage.objects
for insert to authenticated
with check (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update their portfolio media" on storage.objects;
create policy "Users update their portfolio media" on storage.objects
for update to authenticated
using (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their portfolio media" on storage.objects;
create policy "Users delete their portfolio media" on storage.objects
for delete to authenticated
using (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
