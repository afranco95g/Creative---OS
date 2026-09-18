# Spec — Quitar el heurístico de nombre "imagine" de isAgency

**Camino:** Rápido (2 archivos, sin dinero, sin datos personales, sin tipo nuevo).

## Qué está mal hoy

`components/WorkspaceHome.tsx`, variable `isAgency` (gatea "Servicios que
ofrecemos" y "Cursos gestionados"):

```ts
const isAgency =
  funderData?.funder_type === 'agency' ||
  funderData?.name?.toLowerCase().includes('imagine') ||
  activeActor?.type === 'funder' ||
  workspace.user?.email?.toLowerCase().includes('imagine') ||
  workspace.user?.name?.toLowerCase().includes('imagine');
```

- `activeActor?.type === 'funder'` hace que cualquier funder (no solo
  agencias) vea las secciones de agencia — demasiado amplio.
- Las condiciones de nombre/email "imagine" son redundantes: ya existe la
  condición correcta (`funder_type === 'agency'`) y el dato real de
  Imagine ya tiene `funder_type = 'agency'`
  (`database/040_imagine_company_y_music_business_seed.sql`, línea 89).

`services/funders/funderService.ts`, `getAgencyFunder()`: el fallback busca
por nombre (`ilike('name','%Imagine%')`) en vez de por `funder_type =
'agency'`. Mismo problema una capa más abajo.

## Qué cambia

- `isAgency` pasa a ser únicamente `funderData?.funder_type === 'agency'`.
- El fallback de `getAgencyFunder()` filtra por `funder_type = 'agency'`.

## Qué no se toca

- `app/login/page.tsx` línea 91 (redirect de imaginecompanysas@gmail.com)
  — lógica de login, no de gating de workspace. Fuera de alcance.
- No se agrega `role_type` a `spaces`/`people` — pendiente aparte.

## Criterio de aceptación

- `funder_type === 'agency'` sigue siendo `true` para Imagine con los
  datos reales de hoy.
- Ningún otro funder ve las secciones de agencia solo por ser tipo `funder`.
- `npm run typecheck` limpio.
