# Spec corta: "gestor" como sexto valor de `role_type`

## 1. Qué se construye

`funders.role_type` pasa de 5 a 6 valores posibles, agregando `gestor` —
actor enfocado en diálogo comunitario, mapeos territoriales y participación
ciudadana (ver documento de Aliados, sección 8, para el encuadre completo y
las fuentes que confirman que es un rol real y reconocido en Bogotá).

## 2. Por qué

Andrés confirmó (2026-09-17) avanzar con el encuadre de "gestor" como sexto
`role_type`, después de la investigación de la sesión anterior que validó
el rol. Hoy el constraint de `funders.role_type`
(`database/038_actor_role_and_service_catalog.sql`) solo acepta:
`productor`, `marca`, `patrocinador`, `financiador`, `organizacion`.

## 3. Archivos y qué cambia en cada uno

- `database/050_role_type_gestor.sql` — nuevo. `ALTER TABLE funders DROP
  CONSTRAINT funders_role_type_check` (nombre autogenerado por Postgres,
  columna agregada sin nombre explícito en la migración 038) y lo vuelve a
  crear con los 6 valores.

Nada fuera de esta lista. `role_type` no se toca en `people` ni en `spaces`
en esta entrega — ver sección 6.

## 4. Decisiones ya tomadas

- Solo se agrega el valor al constraint existente en `funders` — no se crea
  ninguna tabla nueva, ni se mueve `role_type` a otro eje.
- Ningún archivo TypeScript consume `role_type` todavía (confirmado por
  grep: cero resultados en `services/`, `app/`, `components/`) — esta
  entrega no tiene superficie de UI que actualizar, es solo la base
  quedando lista para cuando `isAgency`/`WorkspaceHome.tsx` empiece a
  leerlo (pendiente #1 de la bitácora del proyecto).
- El nombre del valor es `gestor` (no `manager`, no `cultural_manager`) —
  consistente con cómo Andrés lo nombra en español en toda la conversación,
  y distinto a propósito del valor `manager` que ya existe en
  `people.roles` (son ejes distintos, en tablas distintas).

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores (no debería haber ningún archivo TS
   afectado).
2. `npm test` — todo verde, sin modificar ningún test existente.
3. Lectura de diff: el nuevo constraint tiene exactamente 6 valores:
   `productor`, `marca`, `patrocinador`, `financiador`, `organizacion`,
   `gestor`.
4. Andrés corre la migración 050 en Supabase y confirma que aplicó sin
   error.

## 6. Qué no se toca

- `role_type` no se agrega a `spaces` ni a `people` en esta entrega — la
  brecha original (un gestor que representa un colectivo informal, sin
  fila en `funders` ni cuenta en `people`) sigue sin resolver. Es la
  continuación natural si Andrés decide que hace falta, pero es una
  decisión de alcance nueva, no implícita en "agregar el sexto valor".
- `isAgency` en `WorkspaceHome.tsx` sigue sin leer `role_type` — sigue
  siendo la pendiente #1 de la bitácora, no se toca aquí.
- No se carga ningún actor real con `role_type = 'gestor'` en esta
  migración — eso es una decisión aparte de Andrés (¿quién, en la base,
  es hoy un gestor?), no asumida por esta entrega.
