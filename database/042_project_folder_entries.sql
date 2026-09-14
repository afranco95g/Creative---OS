-- ============================================================
-- CULTURA ESTA
-- Migración 042
-- Carpeta de proyecto musical (formulario por categoría)
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE ENTRADAS DE CARPETA
-- ============================================================

create table if not exists public.project_folder_entries (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  course_id uuid not null
    references public.courses(id)
    on delete cascade,

  category text not null
    check (
      category in (
        'identidad_sonora_visual',
        'documentacion_ejecutiva',
        'presupuestos',
        'estrategia_promocion',
        'plan_distribucion',
        'business_plan_final'
      )
    ),

  data jsonb not null default '{}',

  status text not null default 'pendiente'
    check (
      status in (
        'pendiente',
        'en_progreso',
        'completo'
      )
    ),

  updated_at timestamptz not null default now(),

  unique (
    user_id,
    course_id,
    category
  )
);

create index if not exists project_folder_entries_user_idx
on public.project_folder_entries(user_id);

create index if not exists project_folder_entries_course_idx
on public.project_folder_entries(course_id);

-- ============================================================
-- 2. TRIGGER DE ACTUALIZACIÓN
-- ============================================================

drop trigger if exists project_folder_entries_set_updated_at
on public.project_folder_entries;

create trigger project_folder_entries_set_updated_at
before update on public.project_folder_entries
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.project_folder_entries
enable row level security;

-- ============================================================
-- 4. POLÍTICAS — LECTURA DEL USUARIO
-- ============================================================

drop policy if exists "Users can view their own folder entries"
on public.project_folder_entries;

drop policy if exists "Actor members can view student folder entries"
on public.project_folder_entries;

drop policy if exists "Staff can view all folder entries"
on public.project_folder_entries;

create policy "Users can view their own folder entries"
on public.project_folder_entries
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "Actor members can view student folder entries"
on public.project_folder_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = project_folder_entries.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Staff can view all folder entries"
on public.project_folder_entries
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

-- ============================================================
-- 5. POLÍTICAS — ESCRITURA DEL USUARIO (solo el propio usuario)
-- No existe ninguna política de escritura para miembros del
-- actor — solo lectura, por decisión explícita.
-- ============================================================

drop policy if exists "Users can create their own folder entries"
on public.project_folder_entries;

drop policy if exists "Users can update their own folder entries"
on public.project_folder_entries;

create policy "Users can create their own folder entries"
on public.project_folder_entries
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy "Users can update their own folder entries"
on public.project_folder_entries
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- ============================================================
-- 6. PERMISOS DE TABLA
-- ============================================================

grant select, insert, update
on public.project_folder_entries
to authenticated;

commit;
