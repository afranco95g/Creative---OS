-- ============================================================
-- CULTURA ESTA
-- Migración 041
-- Preguntas de estudiantes sobre lecciones
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE PREGUNTAS
-- ============================================================

create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),

  course_id uuid not null
    references public.courses(id)
    on delete cascade,

  lesson_id uuid not null
    references public.course_lessons(id)
    on delete cascade,

  student_id uuid not null
    references auth.users(id)
    on delete cascade,

  question text not null,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'answered'
      )
    ),

  answer text,

  answered_by uuid
    references auth.users(id),

  answered_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists lesson_questions_course_idx
on public.lesson_questions(course_id);

create index if not exists lesson_questions_student_idx
on public.lesson_questions(student_id);

create index if not exists lesson_questions_lesson_idx
on public.lesson_questions(lesson_id);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table public.lesson_questions
enable row level security;

-- ============================================================
-- 3. POLÍTICAS — LECTURA
-- ============================================================

drop policy if exists "Students can view their own questions"
on public.lesson_questions;

drop policy if exists "Actor members can view course questions"
on public.lesson_questions;

drop policy if exists "Staff can view all questions"
on public.lesson_questions;

create policy "Students can view their own questions"
on public.lesson_questions
for select
to authenticated
using (
  student_id = auth.uid()
);

create policy "Actor members can view course questions"
on public.lesson_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = lesson_questions.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Staff can view all questions"
on public.lesson_questions
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

-- ============================================================
-- 4. POLÍTICAS — ESCRITURA DEL ESTUDIANTE
-- ============================================================

drop policy if exists "Students can create questions"
on public.lesson_questions;

create policy "Students can create questions"
on public.lesson_questions
for insert
to authenticated
with check (
  student_id = auth.uid()
);

-- ============================================================
-- 5. POLÍTICAS — RESPUESTA DEL ACTOR (owner/administrator)
-- ============================================================

drop policy if exists "Actor members can answer questions"
on public.lesson_questions;

create policy "Actor members can answer questions"
on public.lesson_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = lesson_questions.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  exists (
    select 1
    from public.courses
    join public.funder_memberships
      on funder_memberships.funder_id = courses.owner_actor_id
    where courses.id = lesson_questions.course_id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

-- ============================================================
-- 6. PERMISOS DE TABLA
-- ============================================================

grant select, insert, update
on public.lesson_questions
to authenticated;

commit;

