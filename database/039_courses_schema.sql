-- ============================================================
-- CULTURA ESTA
-- Migración 039
-- Esquema de cursos: módulos, lecciones, quizzes, progreso,
-- certificados y almacenamiento de video
-- ============================================================

begin;

-- ============================================================
-- 1. CURSOS
-- ============================================================

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),

  owner_actor_id uuid not null
    references public.funders(id)
    on delete cascade,

  title text not null,

  description text,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'published',
        'archived'
      )
    ),

  price numeric(14, 2) not null default 0,

  payment_structure text,

  certification_enabled boolean not null default false,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists courses_owner_idx
on public.courses(owner_actor_id);

create index if not exists courses_status_idx
on public.courses(status);

-- ============================================================
-- 2. MÓDULOS DEL CURSO
-- ============================================================

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),

  course_id uuid not null
    references public.courses(id)
    on delete cascade,

  title text not null,

  position integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists course_modules_course_idx
on public.course_modules(course_id, position);

-- ============================================================
-- 3. LECCIONES DEL MÓDULO
-- ============================================================

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),

  module_id uuid not null
    references public.course_modules(id)
    on delete cascade,

  title text not null,

  content_type text not null
    check (
      content_type in (
        'video',
        'quiz',
        'document',
        'step_by_step'
      )
    ),

  content_body text not null default '',

  video_path text,

  position integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists course_lessons_module_idx
on public.course_lessons(module_id, position);

-- ============================================================
-- 4. QUIZZES DE LECCIÓN
-- ============================================================

create table if not exists public.lesson_quizzes (
  id uuid primary key default gen_random_uuid(),

  lesson_id uuid not null
    references public.course_lessons(id)
    on delete cascade,

  passing_score integer not null default 0
    check (
      passing_score >= 0
    ),

  created_at timestamptz not null default now(),

  unique (
    lesson_id
  )
);

-- ============================================================
-- 5. PROGRESO DEL USUARIO
-- ============================================================

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  lesson_id uuid not null
    references public.course_lessons(id)
    on delete cascade,

  completed boolean not null default false,

  quiz_score integer,

  completed_at timestamptz,

  created_at timestamptz not null default now(),

  unique (
    user_id,
    lesson_id
  )
);

create index if not exists user_progress_user_idx
on public.user_progress(user_id);

create index if not exists user_progress_lesson_idx
on public.user_progress(lesson_id);

-- ============================================================
-- 6. CERTIFICADOS (tabla reservada — sin emisión en esta entrega)
-- ============================================================

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  course_id uuid not null
    references public.courses(id)
    on delete cascade,

  issued_at timestamptz not null default now(),

  unique (
    user_id,
    course_id
  )
);

-- ============================================================
-- 7. TRIGGER DE ACTUALIZACIÓN (solo courses tiene updated_at)
-- ============================================================

drop trigger if exists courses_set_updated_at
on public.courses;

create trigger courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

alter table public.courses
enable row level security;

alter table public.course_modules
enable row level security;

alter table public.course_lessons
enable row level security;

alter table public.lesson_quizzes
enable row level security;

alter table public.user_progress
enable row level security;

alter table public.certificates
enable row level security;

-- ============================================================
-- 9. POLÍTICAS — CURSOS
-- ============================================================

drop policy if exists "Public can view published courses"
on public.courses;

drop policy if exists "Owners can view their courses"
on public.courses;

drop policy if exists "Staff can view courses"
on public.courses;

drop policy if exists "Owners can create courses"
on public.courses;

drop policy if exists "Owners can update courses"
on public.courses;

drop policy if exists "Owners can delete courses"
on public.courses;

create policy "Public can view published courses"
on public.courses
for select
to anon, authenticated
using (
  status = 'published'
);

create policy "Owners can view their courses"
on public.courses
for select
to authenticated
using (
  exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = courses.owner_actor_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
  )
);

create policy "Staff can view courses"
on public.courses
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Owners can create courses"
on public.courses
for insert
to authenticated
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = courses.owner_actor_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Owners can update courses"
on public.courses
for update
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = courses.owner_actor_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = courses.owner_actor_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Owners can delete courses"
on public.courses
for delete
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = courses.owner_actor_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role = 'owner'
  )
);

-- ============================================================
-- 10. POLÍTICAS — MÓDULOS
-- ============================================================

drop policy if exists "Public can view modules of published courses"
on public.course_modules;

drop policy if exists "Owners can view their course modules"
on public.course_modules;

drop policy if exists "Staff can view course modules"
on public.course_modules;

drop policy if exists "Owners can manage course modules"
on public.course_modules;

create policy "Public can view modules of published courses"
on public.course_modules
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = course_modules.course_id
      and courses.status = 'published'
  )
);

create policy "Owners can view their course modules"
on public.course_modules
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = course_modules.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
  )
);

create policy "Staff can view course modules"
on public.course_modules
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Owners can manage course modules"
on public.course_modules
for all
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = course_modules.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = course_modules.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

-- ============================================================
-- 11. POLÍTICAS — LECCIONES
-- ============================================================

drop policy if exists "Public can view lessons of published courses"
on public.course_lessons;

drop policy if exists "Owners can view their course lessons"
on public.course_lessons;

drop policy if exists "Staff can view course lessons"
on public.course_lessons;

drop policy if exists "Owners can manage course lessons"
on public.course_lessons;

create policy "Public can view lessons of published courses"
on public.course_lessons
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.course_modules
    join public.courses
      on courses.id = course_modules.course_id
    where course_modules.id = course_lessons.module_id
      and courses.status = 'published'
  )
);

create policy "Owners can view their course lessons"
on public.course_lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.course_modules
    join public.courses
      on courses.id = course_modules.course_id
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where course_modules.id = course_lessons.module_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
  )
);

create policy "Staff can view course lessons"
on public.course_lessons
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Owners can manage course lessons"
on public.course_lessons
for all
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.course_modules
    join public.courses
      on courses.id = course_modules.course_id
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where course_modules.id = course_lessons.module_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.course_modules
    join public.courses
      on courses.id = course_modules.course_id
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where course_modules.id = course_lessons.module_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

-- ============================================================
-- 12. POLÍTICAS — QUIZZES DE LECCIÓN
-- ============================================================

drop policy if exists "Public can view quizzes of published courses"
on public.lesson_quizzes;

drop policy if exists "Owners can view their lesson quizzes"
on public.lesson_quizzes;

drop policy if exists "Staff can view lesson quizzes"
on public.lesson_quizzes;

drop policy if exists "Owners can manage lesson quizzes"
on public.lesson_quizzes;

create policy "Public can view quizzes of published courses"
on public.lesson_quizzes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.course_lessons
    join public.course_modules
      on course_modules.id = course_lessons.module_id
    join public.courses
      on courses.id = course_modules.course_id
    where course_lessons.id = lesson_quizzes.lesson_id
      and courses.status = 'published'
  )
);

create policy "Owners can view their lesson quizzes"
on public.lesson_quizzes
for select
to authenticated
using (
  exists (
    select 1
    from public.course_lessons
    join public.course_modules
      on course_modules.id = course_lessons.module_id
    join public.courses
      on courses.id = course_modules.course_id
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where course_lessons.id = lesson_quizzes.lesson_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
  )
);

create policy "Staff can view lesson quizzes"
on public.lesson_quizzes
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Owners can manage lesson quizzes"
on public.lesson_quizzes
for all
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.course_lessons
    join public.course_modules
      on course_modules.id = course_lessons.module_id
    join public.courses
      on courses.id = course_modules.course_id
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where course_lessons.id = lesson_quizzes.lesson_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.course_lessons
    join public.course_modules
      on course_modules.id = course_lessons.module_id
    join public.courses
      on courses.id = course_modules.course_id
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where course_lessons.id = lesson_quizzes.lesson_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

-- ============================================================
-- 13. POLÍTICAS — PROGRESO DEL USUARIO
-- ============================================================

drop policy if exists "Users can view their own progress"
on public.user_progress;

drop policy if exists "Staff can view all progress"
on public.user_progress;

drop policy if exists "Users can create their own progress"
on public.user_progress;

drop policy if exists "Users can update their own progress"
on public.user_progress;

create policy "Users can view their own progress"
on public.user_progress
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "Staff can view all progress"
on public.user_progress
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Users can create their own progress"
on public.user_progress
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy "Users can update their own progress"
on public.user_progress
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- ============================================================
-- 14. POLÍTICAS — CERTIFICADOS
-- Tabla reservada: solo lectura del propio usuario y del staff.
-- Ninguna política de escritura, ni siquiera para el dueño del
-- curso — no hay lógica de emisión en esta entrega.
-- ============================================================

drop policy if exists "Users can view their own certificates"
on public.certificates;

drop policy if exists "Staff can view all certificates"
on public.certificates;

create policy "Users can view their own certificates"
on public.certificates
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "Staff can view all certificates"
on public.certificates
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

-- ============================================================
-- 15. PERMISOS DE TABLA
-- ============================================================

grant select
on public.courses
to anon, authenticated;

grant insert, update, delete
on public.courses
to authenticated;

grant select
on public.course_modules
to anon, authenticated;

grant insert, update, delete
on public.course_modules
to authenticated;

grant select
on public.course_lessons
to anon, authenticated;

grant insert, update, delete
on public.course_lessons
to authenticated;

grant select
on public.lesson_quizzes
to anon, authenticated;

grant insert, update, delete
on public.lesson_quizzes
to authenticated;

grant select, insert, update
on public.user_progress
to authenticated;

grant select
on public.certificates
to authenticated;

-- ============================================================
-- 16. ALMACENAMIENTO DE VIDEO (bucket course-videos)
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit
)
values (
  'course-videos',
  'course-videos',
  false,
  524288000
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists
  "Authenticated can read videos of published courses"
on storage.objects;

drop policy if exists
  "Owners and admins can write course videos"
on storage.objects;

drop policy if exists
  "Owners and admins can update course videos"
on storage.objects;

drop policy if exists
  "Owners and admins can delete course videos"
on storage.objects;

create policy "Authenticated can read videos of published courses"
on storage.objects for select to authenticated
using (
  bucket_id = 'course-videos'
  and exists (
    select 1 from public.courses
    where courses.id::text = (storage.foldername(name))[1]
      and courses.status = 'published'
  )
);

create policy "Owners and admins can write course videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'course-videos'
  and exists (
    select 1 from public.courses
    where courses.id::text = (storage.foldername(name))[1]
      and (
        public.current_profile_role() in ('ecosystem_admin', 'super_admin')
        or exists (
          select 1 from public.funder_memberships
          where funder_memberships.funder_id = courses.owner_actor_id
            and funder_memberships.profile_id = auth.uid()
            and funder_memberships.status = 'active'
            and funder_memberships.role in ('owner', 'administrator')
        )
      )
  )
);

create policy "Owners and admins can update course videos"
on storage.objects for update to authenticated
using (
  bucket_id = 'course-videos'
  and exists (
    select 1 from public.courses
    where courses.id::text = (storage.foldername(name))[1]
      and (
        public.current_profile_role() in ('ecosystem_admin', 'super_admin')
        or exists (
          select 1 from public.funder_memberships
          where funder_memberships.funder_id = courses.owner_actor_id
            and funder_memberships.profile_id = auth.uid()
            and funder_memberships.status = 'active'
            and funder_memberships.role in ('owner', 'administrator')
        )
      )
  )
)
with check (
  bucket_id = 'course-videos'
  and exists (
    select 1 from public.courses
    where courses.id::text = (storage.foldername(name))[1]
      and (
        public.current_profile_role() in ('ecosystem_admin', 'super_admin')
        or exists (
          select 1 from public.funder_memberships
          where funder_memberships.funder_id = courses.owner_actor_id
            and funder_memberships.profile_id = auth.uid()
            and funder_memberships.status = 'active'
            and funder_memberships.role in ('owner', 'administrator')
        )
      )
  )
);

create policy "Owners and admins can delete course videos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'course-videos'
  and exists (
    select 1 from public.courses
    where courses.id::text = (storage.foldername(name))[1]
      and (
        public.current_profile_role() in ('ecosystem_admin', 'super_admin')
        or exists (
          select 1 from public.funder_memberships
          where funder_memberships.funder_id = courses.owner_actor_id
            and funder_memberships.profile_id = auth.uid()
            and funder_memberships.status = 'active'
            and funder_memberships.role in ('owner', 'administrator')
        )
      )
  )
);

commit;
