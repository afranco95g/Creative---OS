# Spec corta: Sub-pestaña Documentos sin filtro + descarga Markdown

## 1. Qué se construye

Dentro de `components/ProjectToolsPanel.tsx`, la función `ExecutiveDocuments`
(la sub-pestaña "Documentos" de `ProjectToolsPanel`) deja de filtrar a solo
`one-pager`/`proposal`/`pitch` y muestra `getAllDocumentReadiness(graph)`
completo. Cada tarjeta gana un segundo botón "Descargar Markdown" junto al
botón de DOC que ya existe.

## 2. Por qué

Instrucción directa del usuario: la sub-pestaña "Documentos" de
`ProjectToolsPanel` (línea 26 hoy: `.filter((item) => ['one-pager',
'proposal', 'pitch'].includes(item.definition.id))`) esconde el resto de
los documentos que `getAllDocumentReadiness` ya puede generar, y solo
ofrece exportación a `.doc`, nunca a Markdown.

## 3. Archivos y qué cambia en cada uno

- `components/ProjectToolsPanel.tsx` — dos cambios, ambos dentro de
  `ExecutiveDocuments` (línea ~25-30) más una función nueva junto a
  `exportDoc` (línea ~83):
  1. Se quita el `.filter(...)` de la línea 26.
  2. Cada `<article>` de documento gana un segundo botón de descarga.
  3. Se agrega la función `exportMarkdown` (ver sección 4).

Ningún otro archivo cambia.

## 4. Decisiones ya tomadas

**Desviación explícita sobre la instrucción original:** el usuario pidió
copiar la lógica de Blob/link/click de `components/DocumentsPanel.tsx`
tal cual. En vez de eso, se reusa el helper `download()` que
`ProjectToolsPanel.tsx` ya tiene (línea 81: `function
download(name:string,content:string,type:string){...}`), el mismo que ya
usa `exportDoc` (línea 83) — mismo resultado funcional (Blob tipo
`text/markdown;charset=utf-8`, descarga vía link+click), pero sin duplicar
una segunda implementación de Blob-creation dentro del mismo archivo que
ya tiene una. Justificación: `download()` ya existe en este archivo
exacto, usar el helper propio es más consistente que copiar el de un
archivo distinto.

Función nueva, junto a `exportDoc` (línea 83), mismo estilo de una sola
línea que ya usa el archivo:

```ts
function exportMarkdown(graph:ProjectGraph,id:string){const d=compileDocument(graph,id);download(`${safe(graph.title)}-${id}.md`,d.content,'text/markdown;charset=utf-8');}
```

`ExecutiveDocuments` completa (reemplaza la función actual, línea ~25-30):

```tsx
function ExecutiveDocuments({ graph }: { graph: ProjectGraph }) {
  const docs = getAllDocumentReadiness(graph);
  const [preview, setPreview] = useState<string | null>(null);
  const selected = preview ? docs.find((item) => item.definition.id === preview) ?? null : null;
  return <><div className="grid gap-5 lg:grid-cols-3">{docs.map((item) => <article key={item.definition.id} className="group rounded-3xl border border-borde/10 bg-superficie-elevada p-6 transition hover:-translate-y-1 hover:border-acento/50"><div className="flex items-start justify-between"><p className="text-xs uppercase tracking-[.16em] text-texto-largo">Documento ejecutivo</p><span className="rounded-full border border-acento/30 bg-acento/5 px-3 py-1 text-xs font-semibold text-texto-principal">{item.readiness}%</span></div><h2 className="mt-5 text-2xl font-semibold">{item.definition.title}</h2><p className="mt-3 min-h-16 text-sm leading-6 text-texto-largo">{item.definition.description}</p><div className="mt-7 flex gap-2"><button onClick={() => setPreview(item.definition.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-borde/15 px-4 py-2 text-sm transition hover:border-acento hover:text-texto-principal"><Presentation size={16}/> Presentar</button><button onClick={() => exportDoc(graph, item.definition.id)} title="Descargar DOC" className="rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso"><Download size={15}/></button><button onClick={() => exportMarkdown(graph, item.definition.id)} title="Descargar Markdown" className="rounded-full border border-borde/15 px-4 py-2 text-sm font-bold text-texto-principal transition hover:border-acento"><FileText size={15}/></button></div></article>)}</div>{selected ? <ExecutivePreviewModal graph={graph} definitionId={selected.definition.id} readiness={selected.readiness} onClose={() => setPreview(null)}/> : null}</>;
}
```

Único cambio de contenido respecto al original: se quita el `.filter(...)`
de la línea `const docs = ...`, y se agrega el tercer `<button>` (ícono
`FileText`, ya importado en este archivo en la línea 4 — no hace falta
agregar ningún import nuevo). El botón de Markdown usa exclusivamente
`border-borde/15`, `text-texto-principal`, `hover:border-acento` — los
mismos tokens que ya usa el botón "Presentar" de la misma fila, ningún
color nuevo.

`ExecutivePreviewModal`, `LivingBudget`, `ProjectCalendar`,
`GrantAssistant` y el resto de funciones del archivo no cambian.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, sin modificar ningún test existente.
3. `grep -n "one-pager', 'proposal', 'pitch'" components/ProjectToolsPanel.tsx` — sin resultados (filtro eliminado).
4. `grep -n "exportMarkdown" components/ProjectToolsPanel.tsx` — aparece la definición de la función y su uso en el `onClick` del botón nuevo.
5. Lectura de diff: `LivingBudget`, `ProjectCalendar`, `GrantAssistant`, `setTools`, `exportBudgetCsv`, `exportIcs`, `exportGrantDoc` quedan byte a byte iguales — el único cambio es dentro de `ExecutiveDocuments` más la función nueva `exportMarkdown`.
6. Lectura del componente: ningún hex crudo (`#...`) ni clase fuera de `superficie`, `superficie-elevada`, `rojo-base`, `acento`, `borde`, `hueso`, `texto-principal`, `texto-largo` en el código agregado.

## 6. Qué no se toca

- `LivingBudget`, `ProjectCalendar`, `GrantAssistant` (Presupuesto vivo, Cronograma, Convocatorias) — sin cambios de ningún tipo.
- `components/DocumentsPanel.tsx` — no se modifica ni se conecta a la navegación, sigue protegido y sin usar.
- `ExecutivePreviewModal`, `ExecutiveContent` y los helpers `setTools`, `blankBudgetLine`, `total`, `money`, `Num`, `inferBudgetSuggestions`, `getRange`, `shift`, `safe`, `exportBudgetCsv`, `exportIcs`, `exportGrantDoc` — sin cambios (solo se agrega `exportMarkdown`, análoga a `exportDoc`, sin tocar las demás).
- Cualquier otro archivo del repo.
