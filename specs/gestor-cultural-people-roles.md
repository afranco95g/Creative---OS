# Spec — "Gestor/a cultural" como valor de people.roles

**Camino:** Rápido (1 archivo, valor ya permitido en base de datos, sin
migración).

## Decisión de Andrés (2026-09-17)

Frente a la corrección de que `manager` (people.roles) y "gestor cultural"
son conceptos distintos, Andrés decidió: agregar un valor nuevo a
`people.roles` para gestor cultural, en vez de extender `role_type` a
`people`/`spaces`.

## Hallazgo antes de construir

`database/003_actor_accounts.sql` (constraint `people_roles_check`, que
reemplazó al constraint inline de `002_people.sql`) **ya permite
`cultural_manager`** — junto con otros cinco valores que tampoco están
expuestos hoy en la UI: `curator`, `researcher`, `space_manager`,
`funder_representative`, `brand_representative`. La constante
`PERSON_ROLES` en `components/MyEcosystemDashboard.tsx` solo expone 10 de
los 16 valores que la base de datos ya permite.

**Consecuencia:** no hace falta ninguna migración para "gestor cultural" —
el valor ya es válido en base de datos desde antes. Solo falta exponerlo en
la UI.

## Qué se construye

Se agrega `['cultural_manager', 'Gestor/a cultural']` a `PERSON_ROLES`
(`components/MyEcosystemDashboard.tsx`), junto a `manager` ("Gestor/a"),
para que quede claro que son dos roles distintos y seleccionables por
separado.

## Qué NO se construye en esta entrega (reportado, no resuelto)

Los otros cinco valores ya permitidos por la base pero no expuestos
(`curator`, `researcher`, `space_manager`, `funder_representative`,
`brand_representative`) quedan reportados como hallazgo — no se agregan a
la UI en esta entrega porque Andrés no los pidió. Es una decisión aparte:
¿se exponen todos, se depuran del constraint los que ya no aplican, o se
dejan como están?

## Criterio de aceptación

- Una persona puede marcar "Gestor/a cultural" como uno de sus roles,
  junto o en vez de "Gestor/a", sin que el guardado falle (el valor ya es
  válido en base de datos).
- `npm run typecheck` limpio.
