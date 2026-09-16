# Spec: asignar rol super_admin a las cuentas de Andres

## 1. Objetivo
Actualizar el rol en `public.profiles` a `super_admin` para las dos cuentas
de Andres: `andres95.francog@gmail.com` y `andres.francog@oda.foundation`.
Ambas cuentas ya existen (confirmado por Andres, visibles en el dashboard de
Supabase Auth).

## 2. Por que ahora
No existe hoy ninguna cuenta con rol `super_admin` asociada a estos dos
correos — el rol se otorga manualmente vía SQL porque `set_profile_role()`
(database/003_actor_accounts.sql, lineas 176-234) exige que quien lo llame
YA sea `super_admin`, y hoy no hay ninguno: es un caso de arranque
("bootstrapping"), no una asignación de rutina.

## 3. Archivos
- `database/046_super_admin_andres.sql` (nuevo): actualiza
  `public.profiles.role` a `'super_admin'` para las dos cuentas, buscando
  por `email`.

No se toca ningún otro archivo. No se crea UI nueva, no se toca
`set_profile_role()`, no se tocan políticas RLS existentes — el rol
`super_admin` y sus políticas ya existen y están cubiertas por
`database/001_profiles.sql`, `database/003_actor_accounts.sql` y
`database/026_superadmin_foundation.sql`.

## 4. Fuera de alcance
- No se crea ninguna cuenta nueva — si alguno de los dos correos no
  aparece en `public.profiles`, la migración falla explícitamente (ver
  sección 5) en vez de crear un perfil o usuario nuevo.
- No se toca `onboarding_path`, `onboarding_status`, `is_active` ni ningún
  otro campo de `profiles` — solo `role`.
- No se otorgan membresías (`funder_memberships`, `space_memberships`) ni
  actores nuevos — `super_admin` opera vía `current_profile_role()`, no vía
  membresías.
- No se toca ninguna otra cuenta ni correo.

## 5. Decisiones ya tomadas
Ambas cuentas ya existen (confirmado por Andres). Aun así, la migración
verifica su existencia en `public.profiles` antes de actualizar — si
alguna de las dos no aparece, la migración se detiene con
`raise exception` (mismo patrón que `database/040_imagine_company_y_music_business_seed.sql`,
líneas 21-24) en vez de continuar a medias o crear un perfil desde cero.
Esto es intencional: otorgar `super_admin` no es una operación que deba
degradar a "hacé lo que puedas" si falta una fila — si algo no calza como
se esperaba, se detiene y se reporta, no se improvisa.

La migración se corre dentro de un único `do $$ ... end $$;` que:
1. Busca el `id` en `public.profiles` para cada uno de los dos correos
   (`email = '...'`, comparación exacta, no `ilike`).
2. Si falta alguno de los dos, `raise exception` con un mensaje que dice
   cuál correo no se encontró.
3. Si ambos existen, hace `update public.profiles set role = 'super_admin'
   where email in (...)`.
4. Un `raise notice` final confirma el `role` resultante de cada una de las
   dos filas (releyendo después del update).

## 6. Interfaces y contratos
Ninguna interfaz nueva. `role` ya es `text` con
`profiles_role_check` (`database/003_actor_accounts.sql`, líneas 37-47) que
ya incluye `'super_admin'` como valor válido — no se modifica el constraint.

## 7. Tests que van a romperse a propósito
Ninguno. Es una migración de datos sobre dos filas existentes, sin cambios
de esquema ni de lógica de aplicación.

## 8. Criterio de aceptación verificable
1. La migración corre sin error contra la base de datos real (ambas cuentas
   existen, según confirmó Andres).
2. `select email, role from public.profiles where email in
   ('andres95.francog@gmail.com', 'andres.francog@oda.foundation');`
   devuelve `role = 'super_admin'` para las dos filas.
3. Ninguna otra fila de `profiles` cambia de rol.
4. Si se corre la migración una segunda vez, no falla y el resultado es el
   mismo (`update` es idempotente por diseño).

## 9. Qué queda determinista y por qué
Todo: es un `update` con `where email in (...)` sobre dos valores fijos y
conocidos, sin inferencia. La verificación previa de existencia hace que el
resultado sea binario: o se aplica exactamente lo pedido, o falla con un
mensaje claro — nunca un estado intermedio.
