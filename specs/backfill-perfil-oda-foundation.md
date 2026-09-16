# Spec: crear la fila faltante en profiles para andres.francog@oda.foundation

## 1. Objetivo
Crear en `public.profiles` la fila correspondiente a la cuenta
`andres.francog@oda.foundation`, que ya existe en `auth.users`
(confirmado con capturas del dashboard de Supabase, uid
`3d6e0af5-a036-45ec-bb07-2825a323c891`) pero no tiene fila en `profiles`
(confirmado: `select ... from public.profiles where id = '3d6e0a...'` y
`where email ilike '%oda.foundation%'` devolvieron 0 filas).

## 2. Por qué ahora
Bloquea directamente `database/046_super_admin_andres.sql` (spec
`specs/super-admin-andres.md`), que falla con `raise exception` al no
encontrar esta fila — funcionando exactamente como se diseñó, no es un bug
de esa migración. La causa más probable es que el trigger
`handle_new_user()` (`database/003_actor_accounts.sql`, líneas 977-1119,
`after insert on auth.users`) no se disparó para esta cuenta — no hay
forma de saber por qué desde el código (podría ser una cuenta creada antes
de que ese trigger existiera, o creada por un camino que no pasó por el
insert normal en `auth.users`). No hay ningún otro mecanismo en el código
(revisado `WorkspaceAuthBridge.tsx`, `services/auth/workspace.ts`) que cree
esta fila de forma automática si falta — sin este backfill, la cuenta
seguirá sin poder operar normalmente en el workspace.

## 3. Archivos
- `database/047_backfill_profile_oda_foundation.sql` (nuevo): inserta la
  fila faltante en `public.profiles` para esa cuenta, replicando
  exactamente la misma lógica de `handle_new_user()`
  (`database/003_actor_accounts.sql`, líneas 987-1052) pero como
  operación puntual sobre un `id` conocido en vez de como trigger.

No se toca ningún otro archivo. No se toca `046_super_admin_andres.sql`
(ya auditada y verificada) — el plan es correr primero esta migración, y
después volver a correr `046` sin cambios, tal como fue diseñada.

## 4. Fuera de alcance
- No se investigan ni se corrigen otras cuentas de `auth.users` que
  pudieran tener el mismo problema — Andrés decidió explícitamente acotar
  esto a la cuenta puntual que bloquea hoy el otorgamiento de
  `super_admin`, no una auditoría general.
- No se modifica ni se repara el trigger `handle_new_user()`.
- No se asigna `role = 'super_admin'` en esta migración — eso lo sigue
  haciendo exclusivamente `046_super_admin_andres.sql`, sin tocarla, para
  mantener el mismo rastro de auditoría que tendría cualquier cuenta que
  se registra y luego se asciende (dos pasos separados, no uno solo).
- No se crea ninguna fila en `people`, `space_memberships` ni
  `funder_memberships` — `handle_new_user()` sí crea una fila en `people`
  (líneas 1060-1075), y esta migración replica también ese paso porque es
  parte del mismo flujo de alta normal, pero no crea `spaces` ni `funders`
  (esos solo se crean si `onboarding_path` es `space`/`funder`, y esta
  cuenta usa el default `person`).

## 5. Decisiones ya tomadas
La migración usa el mismo `coalesce` que `handle_new_user()` para derivar
`full_name` a partir de `raw_user_meta_data` de `auth.users`, con el mismo
orden de fallback (`full_name` → `name` → prefijo del email → texto fijo).
`onboarding_path` usa el mismo default `'person'` que el trigger cuando no
hay `onboarding_path` en `raw_user_meta_data`. `role` se inserta como
`'member'` (el default del trigger) — el ascenso a `super_admin` es tarea
de `046`, no de esta migración.

La migración:
1. Verifica que el `id` (`3d6e0af5-a036-45ec-bb07-2825a323c891`) exista en
   `auth.users` — si no, `raise exception` (no debería pasar, ya está
   confirmado, pero es la misma disciplina que usa `046`).
2. Verifica que NO exista ya una fila en `profiles` para ese `id` — si ya
   existe, `raise notice` y no hace nada (no sobrescribe una fila real por
   accidente si se corre dos veces o si alguien la creó mientras tanto).
3. Inserta la fila en `profiles` replicando `handle_new_user()`.
4. Inserta la fila correspondiente en `people` (`profile_id`, `full_name`,
   `slug` vía `make_unique_slug`, `created_by = id`, `status = 'draft'`),
   igual que hace el trigger, con `on conflict (profile_id) do nothing`.
5. `raise notice` final confirmando la fila creada (o que ya existía).

## 6. Interfaces y contratos
Ninguna interfaz nueva. Mismas columnas y mismos constraints que ya existen
en `profiles` y `people` — no se agrega ni modifica ningún constraint.

## 7. Tests que van a romperse a propósito
Ninguno. Migración de datos puntual, sin cambios de esquema ni de lógica
de aplicación.

## 8. Criterio de aceptación verificable
1. La migración corre sin error contra la base de datos real.
2. `select id, email, role, onboarding_path from public.profiles where id
   = '3d6e0af5-a036-45ec-bb07-2825a323c891';` devuelve exactamente una
   fila, con `email = 'andres.francog@oda.foundation'` y
   `role = 'member'`.
3. `select * from public.people where profile_id =
   '3d6e0af5-a036-45ec-bb07-2825a323c891';` devuelve exactamente una fila.
4. Correr la migración una segunda vez no falla y no duplica filas (el
   `raise notice` de "ya existe" se dispara en vez de un `insert`).
5. Después de correr esta migración, volver a correr
   `database/046_super_admin_andres.sql` sin ningún cambio termina sin
   error y dicha cuenta queda con `role = 'super_admin'`.

## 9. Qué queda determinista y por qué
Todo: son inserciones fijas replicando lógica que ya existe y ya está en
producción (`handle_new_user()`), aplicadas a un único `id` conocido y
confirmado de antemano. No hay inferencia nueva — es una reproducción
puntual de un trigger que no se disparó.
