# Spec: Preparación (checklist Legal + Mercadeo)

## 1. Objetivo
Nueva sub-pestaña "Preparación" dentro de components/ProjectToolsPanel.tsx
con un checklist de estado (pendiente/en proceso/listo) para los ítems de
Legal y Mercadeo que un proyecto necesita para poder aplicar a una
convocatoria o presentarse a un inversionista/aliado.

## 2. Por qué ahora
Decisión ya tomada en esta sesión: Legal y Mercadeo no se subestiman, pero
tampoco se construyen como editores completos sin validar uso real. El
checklist es el mínimo experimento útil — barato, reversible, y ya resuelve
"que el proyecto esté preparado para actuar en el ecosistema".

## 3. Archivos
- types/project.ts — nuevos tipos PreparednessArea, PreparednessStatus,
  PreparednessChecklistItem; ProjectTools gana preparedness?:
  PreparednessChecklistItem[] (opcional, mismo patrón que ingresos/fuentes).
- engines/preparednessEngine.ts (nuevo) — PREPAREDNESS_CHECKLIST_TEMPLATE
  (constante), seedPreparednessChecklist(), getPreparednessSummary().
- core/projectEngine.ts — createInitialProjectGraph() llama a
  seedPreparednessChecklist() para poblar preparedness por defecto.
- components/ProjectToolsPanel.tsx — nueva sub-pestaña "Preparación".
- .test-tools/tests o tests/ (nuevo) — preparednessEngine.test.

## 4. Fuera de alcance
- Subida de archivos reales (RUT, hojas de vida) — queda pendiente de tu
  decisión sobre Adjuntos, no entra aquí.
- Cruce automático entre Preparación y los requisitos de una convocatoria
  específica en Convocatorias — es una mejora futura, no de esta entrega.
- Edición del texto de los ítems del checklist por parte del usuario —
  los ítems son fijos (la plantilla), solo el estado y la nota son editables.

## 5. Decisiones ya tomadas
- PreparednessArea = 'legal' | 'mercadeo'.
- PreparednessStatus = 'pendiente' | 'en_proceso' | 'listo'.
- PreparednessChecklistItem { id, area, title, description, status, note }.
- Ítems fijos de la plantilla (hardcodeados en el engine, mismo patrón que
  DOCUMENT_DEFINITIONS o GRANTS ya existentes en el código):
  Legal: "Estructura legal definida", "Contratos con el equipo",
  "Derechos de autor / propiedad intelectual", "Permisos y licencias".
  Mercadeo: "Público objetivo definido", "Identidad visual lista",
  "Plan de difusión", "Materiales de presentación (one-pager/portfolio)".
  Cada uno con una descripción de una línea explicando qué significa.
- Todo proyecto nuevo se crea con estos 8 ítems en estado 'pendiente' — no
  es un dato de ejemplo falso, es la plantilla universal real del producto.
- getPreparednessSummary(items) devuelve el % de ítems 'listo' por área y
  el % global — determinista, sin inferencia.
- **Ubicación confirmada: sub-pestaña dentro de `ProjectToolsPanel.tsx`**,
  mismo patrón de tabs que Presupuesto vivo/Cronograma/Convocatorias/
  Documentos (el `ToolId`/`tabs` array de esa función). No se toca
  `Sidebar.tsx` ni `AppView` — eso sería un tab de nivel superior, con más
  blast radius (requeriría extender el union type y `NAV_ITEMS`, como pasó
  con la entrega de Bitácora/LogPanel). Un sub-tab más dentro del panel que
  ya agrupa "herramientas del proyecto" es la opción de menor riesgo y la
  más consistente con todo lo construido en esta sesión.
- Tokens de El Culebreo únicamente, cero hex crudo.

## 6. Interfaces y contratos
```ts
export type PreparednessArea = 'legal' | 'mercadeo';
export type PreparednessStatus = 'pendiente' | 'en_proceso' | 'listo';
export interface PreparednessChecklistItem {
  id: ID; area: PreparednessArea; title: string; description: string;
  status: PreparednessStatus; note: string;
}
export function seedPreparednessChecklist(): PreparednessChecklistItem[];
export function getPreparednessSummary(items: PreparednessChecklistItem[]):
  { legalReadiness: number; mercadeoReadiness: number; overallReadiness: number };
```

## 7. Tests que van a romperse a propósito
Ninguno — aditivo puro.

## 8. Criterio de aceptación verificable
1. npm run typecheck — sin errores.
2. npm test — todo verde, sin modificar tests existentes.
3. seedPreparednessChecklist() devuelve exactamente 8 ítems, 4 de cada área.
4. getPreparednessSummary() con 2 de 4 ítems legal en 'listo' devuelve
   legalReadiness === 50.
5. Un proyecto nuevo (createInitialProjectGraph) tiene preparedness con
   8 ítems en 'pendiente'.

## 9. Qué queda determinista y por qué
Todo — es aritmética simple sobre estados que el usuario marca a mano.
Cero inferencia sobre si el proyecto "realmente" está preparado.
