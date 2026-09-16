-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 045
-- Plataforma de Espacio, Fase 1A (piloto Oasis): salones,
-- inventario clasificado, galería, bloqueos de calendario,
-- solicitudes de reserva con pago presencial, y FAQ.
-- Ver specs/plataforma-espacio-fase1-oasis.md
-- ============================================================

begin;

-- ============================================================
-- 1. FUNCIONES DE PERMISOS REUTILIZABLES
-- ============================================================
-- Mismo predicado que ya usan las políticas de "Managers can
-- update spaces" en 003_actor_accounts.sql, extraído a función
-- para no repetirlo en las seis tablas nuevas de esta migración.
-- Se agrega 'editor' porque estas tablas son de contenido
-- operativo del día a día (inventario, fotos), no de identidad
-- del espacio — la spec de Fase 1A lo decide así explícitamente.

create or replace function public.can_manage_space(
  target_space_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_profile_role() in ('ecosystem_admin', 'super_admin')
    or exists (
      select 1
      from public.space_memberships
      where space_memberships.space_id = target_space_id
        and space_memberships.profile_id = auth.uid()
        and space_memberships.status = 'active'
        and space_memberships.role in ('owner', 'administrator', 'editor')
    );
$$;

revoke all on function public.can_manage_space(uuid) from public;
grant execute on function public.can_manage_space(uuid) to authenticated;

create or replace function public.is_space_published(
  target_space_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.spaces
    where spaces.id = target_space_id
      and spaces.status = 'published'
  );
$$;

-- ============================================================
-- 2. SALONES (space_rooms)
-- ============================================================

create table if not exists public.space_rooms (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  capacity integer check (capacity is null or capacity > 0),
  possible_uses text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, slug)
);

create index if not exists space_rooms_space_idx on public.space_rooms(space_id);
create index if not exists space_rooms_status_idx on public.space_rooms(status);

-- ============================================================
-- 3. CATEGORÍAS DE INVENTARIO (vocabulario que crece)
-- ============================================================
-- A diferencia de service_categories (vocabulario cerrado, spec
-- aparte), Andrés pidió explícitamente poder crear categorías
-- nuevas de equipo sobre la marcha. Se modela como tabla, no como
-- check constraint: arranca con las 5 categorías base y cualquier
-- responsable de un espacio puede agregar una nueva.

create table if not exists public.space_inventory_categories (
  key text primary key,
  label text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.space_inventory_categories (key, label, created_by)
values
  ('audio', 'Audio', null),
  ('video', 'Video', null),
  ('iluminacion', 'Iluminación', null),
  ('mobiliario', 'Mobiliario', null),
  ('otro', 'Otro', null)
on conflict (key) do nothing;

-- ============================================================
-- 4. INVENTARIO POR SALÓN (space_room_inventory)
-- ============================================================

create table if not exists public.space_room_inventory (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.space_rooms(id) on delete cascade,
  category_key text not null references public.space_inventory_categories(key),
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  included_in_base_rental boolean not null default true,
  notes text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists space_room_inventory_room_idx on public.space_room_inventory(room_id);
create index if not exists space_room_inventory_category_idx on public.space_room_inventory(category_key);

-- ============================================================
-- 5. GALERÍA (space_media)
-- ============================================================

create table if not exists public.space_media (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.space_rooms(id) on delete cascade,
  inventory_item_id uuid references public.space_room_inventory(id) on delete set null,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null,
  display_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists space_media_room_idx on public.space_media(room_id, display_order);
create index if not exists space_media_inventory_idx on public.space_media(inventory_item_id);

-- ============================================================
-- 6. BLOQUEOS MANUALES DE CALENDARIO (space_room_blocked_dates)
-- ============================================================
-- Mantenimiento, uso interno u otro motivo que no es una reserva.
-- No contiene datos de clientes — puede ser público sin riesgo.

create table if not exists public.space_room_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.space_rooms(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists space_room_blocked_dates_room_idx on public.space_room_blocked_dates(room_id, starts_at);

-- ============================================================
-- 7. SOLICITUDES DE RESERVA (space_booking_requests)
-- ============================================================
-- Contiene datos del cliente que reserva (PII) — RLS restringe
-- lectura al propio solicitante y a quien administra el espacio.
-- Pago siempre presencial en Fase 1A: sin pasarela, se marca
-- manualmente.

create table if not exists public.space_booking_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.space_rooms(id) on delete restrict,
  renter_profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  special_requests text not null default '',
  extra_staff_requested boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  payment_method text not null default 'presencial'
    check (payment_method = 'presencial'),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid')),
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists space_booking_requests_room_idx on public.space_booking_requests(room_id, starts_at);
create index if not exists space_booking_requests_renter_idx on public.space_booking_requests(renter_profile_id);

create table if not exists public.space_booking_request_items (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.space_booking_requests(id) on delete cascade,
  inventory_item_id uuid not null references public.space_room_inventory(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unique (booking_request_id, inventory_item_id)
);

create index if not exists space_booking_request_items_request_idx on public.space_booking_request_items(booking_request_id);

-- ============================================================
-- 8. FAQ (space_faqs)
-- ============================================================

create table if not exists public.space_faqs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  room_id uuid references public.space_rooms(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists space_faqs_space_idx on public.space_faqs(space_id, display_order);

-- ============================================================
-- 9. FUNCIÓN PÚBLICA DE DISPONIBILIDAD (sin PII)
-- ============================================================
-- Expone únicamente rangos de fecha ocupados/bloqueados de un
-- salón, nunca el nombre del solicitante ni el tipo de evento.
-- Mismo patrón que list_master_calendar (030_master_operations.sql).

create or replace function public.list_room_availability(
  target_room_id uuid,
  requested_from timestamptz,
  requested_to timestamptz
)
returns table (
  source text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select 'reserva' as source, b.starts_at, b.ends_at
  from public.space_booking_requests b
  where b.room_id = target_room_id
    and b.status in ('pending', 'confirmed')
    and b.starts_at < requested_to
    and b.ends_at > requested_from
  union all
  select 'bloqueo' as source, d.starts_at, d.ends_at
  from public.space_room_blocked_dates d
  where d.room_id = target_room_id
    and d.starts_at < requested_to
    and d.ends_at > requested_from
  order by 2;
$$;

revoke all on function public.list_room_availability(uuid, timestamptz, timestamptz) from public;
grant execute on function public.list_room_availability(uuid, timestamptz, timestamptz) to anon, authenticated;

-- ============================================================
-- 9B. TRIGGERS DE updated_at (reutiliza public.set_updated_at())
-- ============================================================

drop trigger if exists space_rooms_set_updated_at on public.space_rooms;
create trigger space_rooms_set_updated_at
before update on public.space_rooms
for each row execute function public.set_updated_at();

drop trigger if exists space_room_inventory_set_updated_at on public.space_room_inventory;
create trigger space_room_inventory_set_updated_at
before update on public.space_room_inventory
for each row execute function public.set_updated_at();

drop trigger if exists space_booking_requests_set_updated_at on public.space_booking_requests;
create trigger space_booking_requests_set_updated_at
before update on public.space_booking_requests
for each row execute function public.set_updated_at();

drop trigger if exists space_faqs_set_updated_at on public.space_faqs;
create trigger space_faqs_set_updated_at
before update on public.space_faqs
for each row execute function public.set_updated_at();

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

alter table public.space_rooms enable row level security;
alter table public.space_inventory_categories enable row level security;
alter table public.space_room_inventory enable row level security;
alter table public.space_media enable row level security;
alter table public.space_room_blocked_dates enable row level security;
alter table public.space_booking_requests enable row level security;
alter table public.space_booking_request_items enable row level security;
alter table public.space_faqs enable row level security;

-- --- space_rooms ---

drop policy if exists "Public can view published rooms" on public.space_rooms;
create policy "Public can view published rooms" on public.space_rooms
for select to anon, authenticated
using (status = 'published' and public.is_space_published(space_id));

drop policy if exists "Managers can view their rooms" on public.space_rooms;
create policy "Managers can view their rooms" on public.space_rooms
for select to authenticated
using (public.can_manage_space(space_id));

drop policy if exists "Managers write rooms" on public.space_rooms;
create policy "Managers write rooms" on public.space_rooms
for all to authenticated
using (public.can_manage_space(space_id))
with check (public.can_manage_space(space_id));

-- --- space_inventory_categories ---
-- Lectura pública (es solo vocabulario, sin PII). Cualquier
-- responsable activo de al menos un espacio puede agregar una
-- categoría nueva — Andrés pidió esta extensibilidad.

drop policy if exists "Public can read inventory categories" on public.space_inventory_categories;
create policy "Public can read inventory categories" on public.space_inventory_categories
for select to anon, authenticated
using (true);

drop policy if exists "Space managers can add inventory categories" on public.space_inventory_categories;
create policy "Space managers can add inventory categories" on public.space_inventory_categories
for insert to authenticated
with check (
  public.current_profile_role() in ('ecosystem_admin', 'super_admin')
  or exists (
    select 1 from public.space_memberships
    where space_memberships.profile_id = auth.uid()
      and space_memberships.status = 'active'
      and space_memberships.role in ('owner', 'administrator', 'editor')
  )
);

-- --- space_room_inventory ---

drop policy if exists "Public can view inventory of published rooms" on public.space_room_inventory;
create policy "Public can view inventory of published rooms" on public.space_room_inventory
for select to anon, authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and space_rooms.status = 'published'
      and public.is_space_published(space_rooms.space_id)
  )
);

drop policy if exists "Managers write room inventory" on public.space_room_inventory;
create policy "Managers write room inventory" on public.space_room_inventory
for all to authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
)
with check (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
);

-- --- space_media ---

drop policy if exists "Public can view media of published rooms" on public.space_media;
create policy "Public can view media of published rooms" on public.space_media
for select to anon, authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and space_rooms.status = 'published'
      and public.is_space_published(space_rooms.space_id)
  )
);

drop policy if exists "Managers write room media" on public.space_media;
create policy "Managers write room media" on public.space_media
for all to authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
)
with check (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
);

-- --- space_room_blocked_dates ---
-- Público a propósito: son rangos de fecha sin datos de clientes,
-- necesarios para que cualquiera vea disponibilidad real.

drop policy if exists "Public can view blocked dates" on public.space_room_blocked_dates;
create policy "Public can view blocked dates" on public.space_room_blocked_dates
for select to anon, authenticated
using (true);

drop policy if exists "Managers write blocked dates" on public.space_room_blocked_dates;
create policy "Managers write blocked dates" on public.space_room_blocked_dates
for all to authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
)
with check (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
);

-- --- space_booking_requests (PII: acceso restringido) ---

drop policy if exists "Renters view own booking requests" on public.space_booking_requests;
create policy "Renters view own booking requests" on public.space_booking_requests
for select to authenticated
using (renter_profile_id = auth.uid());

drop policy if exists "Managers view booking requests of their rooms" on public.space_booking_requests;
create policy "Managers view booking requests of their rooms" on public.space_booking_requests
for select to authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
);

drop policy if exists "Authenticated users create booking requests" on public.space_booking_requests;
create policy "Authenticated users create booking requests" on public.space_booking_requests
for insert to authenticated
with check (
  renter_profile_id = auth.uid()
  and exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and space_rooms.status = 'published'
      and public.is_space_published(space_rooms.space_id)
  )
);

drop policy if exists "Renters cancel own pending requests" on public.space_booking_requests;
create policy "Renters cancel own pending requests" on public.space_booking_requests
for update to authenticated
using (renter_profile_id = auth.uid() and status = 'pending')
with check (renter_profile_id = auth.uid() and status = 'cancelled');

drop policy if exists "Managers update booking requests of their rooms" on public.space_booking_requests;
create policy "Managers update booking requests of their rooms" on public.space_booking_requests
for update to authenticated
using (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
)
with check (
  exists (
    select 1 from public.space_rooms
    where space_rooms.id = room_id
      and public.can_manage_space(space_rooms.space_id)
  )
);

-- --- space_booking_request_items ---
-- Hereda la visibilidad/gestión de la solicitud a la que pertenece.

drop policy if exists "Visibility follows parent booking request" on public.space_booking_request_items;
create policy "Visibility follows parent booking request" on public.space_booking_request_items
for select to authenticated
using (
  exists (
    select 1 from public.space_booking_requests b
    where b.id = booking_request_id
      and (
        b.renter_profile_id = auth.uid()
        or exists (
          select 1 from public.space_rooms
          where space_rooms.id = b.room_id
            and public.can_manage_space(space_rooms.space_id)
        )
      )
  )
);

drop policy if exists "Requester writes own booking items" on public.space_booking_request_items;
create policy "Requester writes own booking items" on public.space_booking_request_items
for insert to authenticated
with check (
  exists (
    select 1 from public.space_booking_requests b
    where b.id = booking_request_id
      and b.renter_profile_id = auth.uid()
      and b.status = 'pending'
  )
);

drop policy if exists "Managers delete booking items of their rooms" on public.space_booking_request_items;
create policy "Managers delete booking items of their rooms" on public.space_booking_request_items
for delete to authenticated
using (
  exists (
    select 1 from public.space_booking_requests b
    join public.space_rooms r on r.id = b.room_id
    where b.id = booking_request_id
      and public.can_manage_space(r.space_id)
  )
);

-- --- space_faqs ---

drop policy if exists "Public can read faqs of published spaces" on public.space_faqs;
create policy "Public can read faqs of published spaces" on public.space_faqs
for select to anon, authenticated
using (public.is_space_published(space_id));

drop policy if exists "Managers write faqs" on public.space_faqs;
create policy "Managers write faqs" on public.space_faqs
for all to authenticated
using (public.can_manage_space(space_id))
with check (public.can_manage_space(space_id));

-- ============================================================
-- 11. STORAGE: BUCKET DE GALERÍA (space-media)
-- ============================================================
-- Mismo patrón que experience-images (012) y product-assets (030):
-- bucket público de lectura, escritura en la carpeta del propio
-- usuario autenticado.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'space-media',
  'space-media',
  true,
  314572800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read space media" on storage.objects;
create policy "Public can read space media" on storage.objects
for select to public
using (bucket_id = 'space-media');

drop policy if exists "Users upload space media" on storage.objects;
create policy "Users upload space media" on storage.objects
for insert to authenticated
with check (bucket_id = 'space-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update their space media" on storage.objects;
create policy "Users update their space media" on storage.objects
for update to authenticated
using (bucket_id = 'space-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'space-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their space media" on storage.objects;
create policy "Users delete their space media" on storage.objects
for delete to authenticated
using (bucket_id = 'space-media' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
