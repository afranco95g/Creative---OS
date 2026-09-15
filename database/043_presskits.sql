-- ============================================================
-- CULTURA ESTA
-- Migración 043
-- Press kits de artistas
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE PRESSKITS
-- ============================================================

create table if not exists public.presskits (
  id uuid primary key default gen_random_uuid(),

  owner_actor_id uuid not null
    references public.funders(id)
    on delete cascade,

  client_user_id uuid not null
    references auth.users(id)
    on delete cascade,

  artist_name text not null,

  bio_short text,

  contact text,

  links jsonb not null default '[]',

  tracks jsonb not null default '[]',

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'generated'
      )
    ),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists presskits_owner_actor_idx
on public.presskits(owner_actor_id);

create index if not exists presskits_client_user_idx
on public.presskits(client_user_id);

-- ============================================================
-- 2. TRIGGER DE ACTUALIZACIÓN
-- ============================================================

drop trigger if exists presskits_set_updated_at
on public.presskits;

create trigger presskits_set_updated_at
before update on public.presskits
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.presskits
enable row level security;

-- ============================================================
-- 4. POLÍTICAS — LECTURA
-- ============================================================

drop policy if exists "Clients can view their own presskits"
on public.presskits;

drop policy if exists "Actor members can view client presskits"
on public.presskits;

drop policy if exists "Staff can view all presskits"
on public.presskits;

create policy "Clients can view their own presskits"
on public.presskits
for select
to authenticated
using (
  client_user_id = auth.uid()
);

create policy "Actor members can view client presskits"
on public.presskits
for select
to authenticated
using (
  exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = presskits.owner_actor_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Staff can view all presskits"
on public.presskits
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

-- ============================================================
-- 5. POLÍTICAS — ESCRITURA DEL CLIENTE
-- El contenido lo llena el cliente — los miembros del actor
-- solo pueden leer, no editar.
-- ============================================================

drop policy if exists "Clients can create presskits"
on public.presskits;

drop policy if exists "Clients can update their own presskits"
on public.presskits;

create policy "Clients can create presskits"
on public.presskits
for insert
to authenticated
with check (
  client_user_id = auth.uid()
);

create policy "Clients can update their own presskits"
on public.presskits
for update
to authenticated
using (
  client_user_id = auth.uid()
)
with check (
  client_user_id = auth.uid()
);

-- ============================================================
-- 6. PERMISOS DE TABLA
-- ============================================================

grant select, insert, update
on public.presskits
to authenticated;

commit;

