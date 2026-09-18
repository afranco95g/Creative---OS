# Spec — Fase 3: motor de emparejamiento + "Aliados sugeridos" visible

**Camino:** Rápido (motor puro nuevo + un servicio de lectura + una sección
de UI dentro de un componente ya existente; sin dinero, sin datos
personales, reutiliza vocabulario ya cerrado).

## Decisión de Andrés (2026-09-17)

Basta **una** categoría en común entre `ProjectTools.needs` y el
`service_categories` de un aliado para sugerirlo — no hace falta que
coincidan todas.

## Qué se construye

1. **`engines/alliesMatchingEngine.ts`** — función pura y determinista
   `matchAlliesToNeeds(needs: string[], allies: AllyForMatching[]):
   AllyMatch[]`. Un aliado entra al resultado si tiene al menos una
   categoría en `service_categories` que también esté en `needs`.
   `AllyMatch` trae el aliado más `matchedCategories: string[]` (las
   categorías que coincidieron, para poder explicar el porqué en la UI).
   Sin llamadas a red, sin fecha de hoy — mismo patrón que
   `projectDependencyEngine.ts`.
2. **`services/ecosystem/alliesDirectory.ts`** — `listMatchableAllies():
   Promise<AllyForMatching[]>`, consulta directa (cliente de navegador,
   `lib/supabase/client`) a `funders` y `spaces` con `status = 'published'`
   (política RLS "Public can view published spaces/funders" ya lo permite
   sin autenticación especial), trayendo `id, name, slug, service_categories`
   más el tipo de actor (`'space' | 'funder'`) para poder construir el link
   público con `getPublicActorHref` (`services/public/publicEcosystem.ts`).
3. **UI — dentro de `ProjectNeeds` (`components/ProjectToolsPanel.tsx`)**:
   debajo del selector de necesidades, una sección "Aliados sugeridos" que
   carga `listMatchableAllies()` una vez, corre `matchAlliesToNeeds` cada
   vez que cambian las necesidades del proyecto, y muestra cada match con
   nombre, tipo de actor, las categorías que coincidieron (usando las
   etiquetas humanas de `SERVICE_CATEGORIES`) y un link a su perfil
   público. Si `needs` está vacío, no se llama al motor y se muestra un
   mensaje invitando a declarar necesidades primero.

## Qué no se toca

- No se usa el campo `offers` (columna legacy de texto libre en
  `spaces`/`funders`, distinta de `service_categories` — la que hoy
  alimenta el perfil público). Es una redundancia identificada, no se
  resuelve en esta entrega.
- No se agrega ningún flujo de contacto/solicitud desde "Aliados
  sugeridos" — es una lista informativa con link al perfil público, el
  contacto real es el tema de la spec de portafolio + cotización (aparte).
- No se pagina ni se cachea la lista de aliados — hoy son ~6, no hace
  falta.

## Criterio de aceptación

- Un proyecto con una sola necesidad que coincide con una sola categoría
  de un aliado ya lo sugiere (no exige que coincidan todas).
- Un proyecto sin necesidades declaradas no dispara ningún llamado a
  `matchAlliesToNeeds`.
- `npm run typecheck` limpio, `npm test` sin romper nada existente,
  `eslint` sin errores nuevos.
