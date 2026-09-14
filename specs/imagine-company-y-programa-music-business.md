# Spec: Imagine Company (agencia) + módulo de cursos + seed de Music Business

Todas las secciones son obligatorias. Si una sección no aplica, se escribe
explícitamente "ninguno"/"ninguna" y por qué.

Camino elegido: **completo** (constructor → auditor, revisor solo si hay
desacuerdo) — toca plata que el usuario ve (`courses.price`), datos
personales (email de un actor real), tipos nuevos y más de 4 archivos.

## 1. Objetivo

Dar de alta el actor "Imagine Company" (agencia, capacidad `productor`) sobre
la infraestructura de `funders` existente, construir el esquema de cursos
(courses/módulos/lecciones/quizzes/progreso/certificados) con RLS desde el
día uno, exponer una capa `services/courses/` con validación zod, y sembrar
el curso "Music Business" en estado `draft` con sus 6 módulos y lecciones.

## 2. Por qué ahora

Imagine Company necesita cuenta y perfil de servicios publicado, y el
programa Music Business necesita existir en base de datos (en borrador,
sin publicar) para que Andrés pueda revisarlo antes de abrirlo a
inscripciones. Hoy no existe ninguna tabla de cursos ni actor de tipo
agencia para Imagine Company — es construcción greenfield, no hay nada que
migrar ni deprecar.

## 3. Archivos que se crean o se modifican

Se crean:

- `database/038_actor_role_and_service_catalog.sql` — agrega `role_type` y
  `service_catalog` a `public.funders` (Tarea 1, solo schema).
- `database/039_courses_schema.sql` — las 6 tablas de cursos, RLS, y el
  bucket `course-videos` con sus políticas de Storage (Tareas 2 y 3).
- `database/040_imagine_company_y_music_business_seed.sql` — seed de datos:
  actor Imagine Company vinculado a un `auth.users` ya existente, curso
  Music Business con 6 módulos y sus lecciones (Tareas 1 y 5, solo DML).
- `services/courses/courseService.ts` — `createCourse`, `listCourses`,
  `getCourseById`.
- `services/courses/courseContentService.ts` — `addModule`, `addLesson`.
- `services/courses/courseProgressService.ts` — `updateProgress`.

Se modifican:

- `package.json` / `package-lock.json` — se agrega `zod` como dependencia
  nueva (no existe hoy en el repo, ver sección 5.6). Ejecutar
  `npm install zod` como parte de esta entrega, no editar el lockfile a mano.

No se toca ningún archivo bajo `app/`, `components/`, `features/` ni
`engines/` — no hay pantalla ni flujo de UI en esta entrega (ver sección 4).
No se toca `database/032_project_sync_and_knowledge.sql` ni
`database/034_knowledge_engine_metadata.sql` (issue de duplicación ya
identificado, fuera de esta spec).

## 4. Fuera de alcance

- Ninguna pantalla ni componente de UI para cursos (ni admin ni alumno).
  Esta entrega es solo datos + capa de servicios. Aunque el árbol
  `app/`/`components/` tenga huecos obvios para "ver mis cursos", no se
  llenan aquí.
- Ningún flujo de invitación o magic link nuevo. Por decisión explícita del
  dueño del proyecto (ver 5.1), esta entrega **no** crea usuarios de
  Supabase Auth ni usa `admin.inviteUserByEmail` ni `signInWithOtp`. El
  usuario de Auth para `imaginecompanysas@gmail.com` ya existe o se crea
  manualmente en el dashboard de Supabase antes de correr la migración 040.
- Ninguna lógica de emisión de certificados. `certificates` queda como
  tabla reservada, con RLS de solo lectura del propio usuario y sin ninguna
  política de escritura — ni siquiera para el dueño del curso.
- Ningún motor de calificación automática de quizzes más allá de comparar
  `quiz_score` recibido contra `lesson_quizzes.passing_score` dentro de
  `updateProgress`. No hay lógica de puntaje por pregunta, no hay
  corrección de respuestas.
- Ninguna pasarela de pago. `courses.price` y `payment_structure` son
  campos informativos; no hay checkout, no hay integración con proveedor
  de pagos.
- No se publica el curso (`status` queda en `'draft'`) ni se cambia
  `funders.status` de Imagine Company a `'published'` — ninguna de las dos
  cosas fue pedida explícitamente, y CLAUDE.md más la propia tarea piden
  no publicar hasta revisión de Andrés.
- No se sube ningún video real al bucket `course-videos` — la migración
  039 crea el bucket y sus políticas; la migración 040 siembra lecciones
  con `video_path = null`.
- No se toca el rename pendiente "Cultura Está"/"El Culebreo".
- No se toca nada de la Fase 0 de seguridad (Next.js, middleware, rate
  limiting) — otro plan de trabajo en curso.
- No se crea ninguna tabla `actors` unificada. Se sigue usando la
  infraestructura existente `profiles` + `funders` (ver 5.2) — unificar el
  modelo de actor es un cambio de arquitectura mucho más grande que esta
  spec no autoriza.

## 5. Decisiones ya tomadas

### 5.1 Sin flujo de invitación — lookup de `auth.users` existente, falla si no está

El dueño del proyecto decidió explícitamente (sobre la instrucción
original de la tarea, que pedía "usa el flujo de invitación/magic link, o
créalo si no existe"): **no crear ningún flujo de invitación nuevo**. La
migración `040_imagine_company_y_music_business_seed.sql` empieza así:

```sql
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'imaginecompanysas@gmail.com'
  limit 1;

  if v_user_id is null then
    raise exception
      'Usuario no encontrado en auth.users para email imaginecompanysas@gmail.com — créalo primero en el dashboard de Supabase Auth antes de correr esta migración.';
  end if;

  -- resto del seed usa v_user_id, ver 5.4
end $$;
```

`services/auth/` **no se toca** en esta entrega. Si en el futuro se
necesita un flujo de invitación real, es una spec aparte.

### 5.2 "Agencia" = `funders.funder_type = 'agency'`, no hay tabla `actors`

No existe una tabla `actors` con `account_type` en este repo — el modelo
real son tres tablas (`people`/`spaces`/`funders`) más el discriminador
`profiles.onboarding_path` (`person|space|brand|agency|organization`,
`database/019_account_actor_registration.sql:16-26`). "Agencia" ya
corresponde 1:1 a `funders.funder_type = 'agency'`
(`database/003_actor_accounts.sql:600-608`) — no se crea ninguna tabla ni
columna para representar `account_type`, se usa la que ya existe.

### 5.3 Capacidad `productor` → columna nueva `funders.role_type`, no reusar `support_modes`

Se verificó que `funders` no tiene ninguna columna de tipo/rol más allá de
`funder_type` (que ya distingue brand/company/foundation/public_entity/
agency/individual/other — no hay una segunda dimensión existente para
"productor"). Por decisión explícita del dueño del proyecto: columna nueva
`role_type text`, no `capacity_role` (para no ecoar `spaces.capacity`, que
es aforo físico de un espacio, un concepto distinto) y no reusar
`support_modes text[]` (que ya significa "modos de apoyo/patrocinio", no
"rol del actor en el ecosistema"). Migración 038:

```sql
alter table public.funders
add column if not exists role_type text
  check (
    role_type in (
      'productor',
      'marca',
      'patrocinador',
      'financiador',
      'organizacion'
    )
  );
```

Sin `not null` ni default — actores existentes quedan con `role_type null`
hasta que se les asigne uno; no es retroactivo para filas ya creadas.

### 5.4 Catálogo de servicios → columna nueva `funders.service_catalog text[]`

No existe ningún campo array/jsonb reutilizable para un catálogo de
servicios (`interests`/`support_modes` son listas de tags de otro dominio
semántico). Se agrega una columna, no una tabla nueva (cumple la condición
de la tarea: "no tabla nueva si el modelo ya soporta un campo tipo
array/jsonb" se lee como preferencia general contra tablas nuevas para
esto, y una columna nueva la satisface sin crear una tabla):

```sql
alter table public.funders
add column if not exists service_catalog text[] not null default '{}';
```

Migración 040 la puebla para Imagine Company con exactamente:

```sql
array[
  'Campañas de marketing para marcas/empresas',
  'Activaciones BTL',
  'Programa Music Business'
]
```

### 5.5 Seed de Imagine Company es idempotente y no publica la cuenta

La migración 040 debe poder correr más de una vez sin duplicar filas
(convención del repo: `create table if not exists`, `on conflict do
update`). Orden dentro del bloque `do $$`, después de resolver
`v_user_id` (5.1):

1. `insert into public.profiles (id, email, full_name, role,
   onboarding_path, onboarding_status, is_active) values (v_user_id, ...,
   'Imagine Company', 'member', 'agency', 'completed', true) on conflict
   (id) do update set onboarding_path = 'agency', onboarding_status =
   'completed';` — cubre tanto el caso en que el trigger
   `handle_new_user()` ya creó el profile (si quien creó el usuario en el
   dashboard puso `onboarding_path: agency` en los metadatos) como el caso
   en que no.
2. Buscar un `funders` row existente con `created_by = v_user_id` — si
   existe, actualizar `name`, `funder_type = 'agency'`, `role_type =
   'productor'`, `service_catalog = ...` sobre esa fila (puede haberla
   creado el mismo trigger). Si no existe, insertarla. `status` **no se
   toca** — queda en su default `'draft'`, no se publica en esta entrega.
3. `insert into public.funder_memberships (funder_id, profile_id, role,
   status) values (..., v_user_id, 'owner', 'active') on conflict
   (funder_id, profile_id) do update set role = 'owner', status =
   'active';` — mismo patrón de owner-membership que usa
   `create_funder_owner_membership()` para altas normales.
4. El `course` y sus `course_modules`/`course_lessons` (Tarea 5) se
   insertan con guards `if not exists (select 1 from public.courses where
   owner_actor_id = v_funder_id and title = 'Music Business')` — incluir
   este guard evita duplicar el curso completo si la migración se corre
   dos veces.

`courses.description` queda **`null`** — la tarea no da un texto de
descripción y no se inventa contenido no pedido.

### 5.6 Se agrega `zod` como dependencia nueva

El repo no usa `zod` hoy (no está en `package.json`; `AUDIT_REPORT.md:165`
lo señala como ausente/recomendado). La tarea original pide explícitamente
"cada [función] con schema zod de validación de payload" — se toma como
instrucción literal, no como "ya existe en el repo, replicar el patrón": se
agrega `zod` como dependencia nueva y se usa solo dentro de
`services/courses/`. El resto de `services/` sigue con su patrón actual
(checks manuales `if (...) throw new Error(...)`) — esta entrega no migra
servicios existentes a zod, sería expandirse fuera de alcance.

### 5.7 `services/courses/` usa `supabase.from()` directo, no RPC

Ningún endpoint de `services/courses/` necesita atomicidad multi-tabla
(cada función escribe una sola fila). Se sigue el patrón de
`services/ecosystem/personProfileService.ts`: import
`import { supabase } from '@/lib/supabase/client';`, funciones `async`
exportadas, `interface X` (camelCase, cara pública) +
`interface XRow` (snake_case, fila de Supabase) + mapper manual, error de
Supabase relanzado como `throw new Error(error.message || '<fallback en
español>')`. Los tres archivos de servicios corren client-side (browser),
protegidos por RLS — no hay cliente admin/service-role en esta entrega
(ver 5.1, no se introduce `SUPABASE_SERVICE_ROLE_KEY`).

Firmas exactas:

```ts
// courseService.ts
export async function createCourse(input: CreateCourseInput): Promise<Course>
export async function listCourses(filter?: { status?: CourseStatus; ownerActorId?: string }): Promise<Course[]>
export async function getCourseById(id: string): Promise<Course | null>

// courseContentService.ts
export async function addModule(input: AddModuleInput): Promise<CourseModule>
export async function addLesson(input: AddLessonInput): Promise<CourseLesson>

// courseProgressService.ts
export async function updateProgress(input: UpdateProgressInput): Promise<{ progress: UserProgress; passed: boolean | null }>
```

`updateProgress` calcula `passed` comparando el `quizScore` recibido contra
`lesson_quizzes.passing_score` de esa lección (`null` si la lección no
tiene quiz o no se envió `quizScore`) — no persiste `passed`, es un valor
derivado devuelto al llamador, cumpliendo el límite de "no más que
comparar" del alcance.

### 5.8 Tipos de contenido de lección y estados, valores exactos

- `course_lessons.content_type` — check `in ('video', 'quiz', 'document',
  'step_by_step')`, exactamente como especifica la tarea.
- `courses.status` — check `in ('draft', 'published', 'archived')`,
  default `'draft'`. (`'archived'` no la pide la tarea explícitamente pero
  se agrega por consistencia con `spaces.status`/`funders.status`, que
  siempre incluyen un estado terminal de baja; no cambia ningún
  comportamiento de esta entrega.)

### 5.9 `user_progress` tiene unicidad `(user_id, lesson_id)`

No la pide la tarea explícitamente, pero es necesaria para que
`updateProgress` tenga semántica de upsert (si no, cada llamada crearía una
fila nueva en vez de actualizar el progreso de esa lección). Se agrega:

```sql
unique (user_id, lesson_id)
```

### 5.10 Ruta de Storage para videos y política de lectura/escritura

Convención del bucket (igual a `experience-images` en
`database/012_experience_image_storage.sql:13-100`, adaptada porque acá la
visibilidad depende del `status` del curso, no de ownership plano):

- Ruta del objeto: `<course_id>/<lesson_id>/<filename>`.
- Bucket **no público** (`public = false` en `storage.buckets`) — la
  lectura se controla por policy, no por flag de bucket, porque depende de
  `courses.status`.

```sql
insert into storage.buckets (id, name, public, file_size_limit)
values ('course-videos', 'course-videos', false, 524288000)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

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
-- + update/delete con el mismo with check que insert
```

`file_size_limit` en 500 MB (`524288000`) — valor razonable para video
educativo, no viene especificado en la tarea; si Andrés quiere otro límite
es un cambio de una línea, no bloquea esta entrega.

## 6. Interfaces y contratos que hay que respetar

- `public.current_profile_role()` (`database/003_actor_accounts.sql:109-119`)
  — se reusa tal cual para los checks de admin en RLS de `courses` y las
  policies de Storage. No se crea una función de rol paralela.
- `public.set_updated_at()` (`database/001_profiles.sql:64`) — se reusa
  para el trigger `updated_at` de `courses` (es la única de las 6 tablas
  nuevas con columna `updated_at`).
- `public.funder_memberships` (`database/003_actor_accounts.sql:663-699`)
  — se consume tal cual para resolver ownership de `courses` vía
  `owner_actor_id → funders.id → funder_memberships`. No se agrega ninguna
  columna nueva a `funder_memberships`.
- Convención de idempotencia del repo — todo `create table`/`create
  policy`/`insert into storage.buckets` en las migraciones 038-040 sigue el
  patrón `if not exists` / `drop policy if exists ... create policy` /
  `on conflict ... do update` ya usado en las 37 migraciones existentes.
- `services/courses/*` expone únicamente las 6 funciones listadas en 5.7 —
  ninguna otra función pública en esta entrega. Cualquier componente futuro
  de UI debe llamar estas funciones, nunca `supabase.from('courses')`
  directo.
- Zod (nueva dependencia, ver 5.6): un `zod.object({...})` por cada input
  type (`CreateCourseInput`, `AddModuleInput`, `AddLessonInput`,
  `UpdateProgressInput`), `.parse()` (no `.safeParse()` silencioso) al
  inicio de cada función exportada, antes de cualquier llamada a Supabase —
  un payload inválido debe lanzar el `ZodError` tal cual, sin envolverlo.

## 7. Tests que van a romperse a propósito

Ninguno. Esta entrega no toca `engines/`, `questionEngine.ts`, ni ningún
archivo cubierto por la suite de 10 tests de la línea base verificada
(`Knowledge Query Builder`, `Kicks interpretation`, `Dobla y devora
classification`, `Project Knowledge V2`, `Executive Engine V2.3`,
`Executive Engine V2.4 Financial Authority`, `MUSCO runtime integration`,
`Project seed extraction`, `Opening block`, `Answer routing`). Es
infraestructura nueva y desconectada de esos motores — no hay overlap.

## 8. Criterio de aceptación verificable

1. `npm run typecheck` limpio (salida literal en el reporte).
2. `npm test` — las 10 suites de la línea base siguen en verde, salida
   literal en el reporte (ninguna nueva suite se agrega en esta entrega,
   no se pidieron tests para `services/courses/`).
3. `grep -n "role_type\|service_catalog" database/038_actor_role_and_service_catalog.sql`
   muestra las dos columnas nuevas, ninguna con `not null` en `role_type`
   (ver 5.3).
4. `grep -c "enable row level security" database/039_courses_schema.sql`
   devuelve exactamente `6` — una por cada una de `courses`,
   `course_modules`, `course_lessons`, `lesson_quizzes`, `user_progress`,
   `certificates`.
5. `grep -n "for insert\|for update\|for delete" database/039_courses_schema.sql`
   sobre el bloque de `certificates` no debe tener ningún resultado — cero
   políticas de escritura sobre esa tabla en toda la migración.
6. `database/040_imagine_company_y_music_business_seed.sql` contiene el
   `raise exception` de 5.1 dentro de un `if v_user_id is null` — falla
   explícita, no un actor huérfano.
7. El seed inserta exactamente 6 filas en `course_modules` para el curso
   Music Business (una por módulo) y el total de filas en `course_lessons`
   para esas 6 igual a la suma de lecciones listada en la tarea: 5+6+3+4+5+4
   = 27.
8. Cada `course_lessons.content_type` sembrado en 040 es literalmente
   `'step_by_step'` y `content_body = ''`.
9. `courses.status = 'draft'`, `courses.price = 2100000`,
   `courses.payment_structure = '2 pagos de 1.050.000 COP'`,
   `courses.certification_enabled = false` para la fila sembrada — se
   verifica leyendo el `insert into public.courses (...)` en 040, no
   corriendo la migración contra una base real (no hay entorno de
   verificación con Supabase real disponible en este ciclo).
10. Los 3 archivos de `services/courses/` exportan exactamente las 6
    funciones firmadas en 5.7, cada una con un `.parse()` de un esquema
    zod como primera línea ejecutable del cuerpo (verificable leyendo el
    archivo, archivo+línea).
11. `package.json` tiene `"zod"` en `dependencies` (no en `devDependencies`
    — se usa en código que corre en el browser).

## 9. Qué queda determinista y por qué

Todo lo construido en esta entrega es determinista por diseño — no hay
interpretación de texto libre en ningún punto:

- **RLS de las 6 tablas nuevas** decide acceso por `auth.uid()`,
  `current_profile_role()` y membership de `funder_memberships` — reglas
  fijas de Postgres, auditables leyendo la policy, no un modelo.
- **`courses.price`/`payment_structure`** son datos planos sembrados
  literalmente desde la tarea, sin cálculo ni normalización.
- **`updateProgress`** compara `quizScore >= passing_score` — comparación
  numérica determinista, ninguna heurística ni modelo de lenguaje decide
  si alguien "pasó" el quiz.
- **El lookup de `auth.users` en 5.1** es una consulta exacta por email,
  con falla explícita si no hay match — no hay fuzzy-matching ni
  creación implícita de usuario.

No hay ningún módulo de lenguaje externo ni interpretación de texto libre
en esta entrega — no aplica la restricción de interfaz intercambiable de
CLAUDE.md porque no hay nada que interpretar.
