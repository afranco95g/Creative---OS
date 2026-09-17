# Spec corta: publicar aliados-espacio piloto + alta de Estación 2600

## 1. Qué se construye

Migración de datos (no de esquema, no de código de producto): los cuatro
aliados-espacio ya cargados (Stainless Space, Oasis, Taller 108, Club del
Café) pasan de `status='draft'` a `status='published'` en `spaces`, y se
carga un quinto aliado-espacio nuevo, Estación 2600, en `draft`.

## 2. Por qué

Andrés visitó `/ecosistema` (directorio público) y vio "0 perfiles" en la
sección Espacios — no es un bug: los cuatro aliados-espacio están cargados
desde la migración 044 con `status='draft'`, y
`list_published_ecosystem_actors()` (`database/009_public_ecosystem.sql`)
solo lista `status='published'`. Andrés decidió publicarlos ya, aunque
todavía no tengan salones/inventario/fotos cargados en Plataforma de
Espacio (`/workspace/espacio`). Además pidió cargar un nuevo aliado real,
Estación 2600 (estudio de producción musical: ensayo para proyectos
acústicos, producción de podcast, masterización y mezcla).

## 3. Archivos y qué cambia en cada uno

- `database/048_publicar_aliados_espacio_y_estacion2600.sql` — nuevo.
  `UPDATE spaces SET status='published'` para los cuatro por nombre; `INSERT`
  (o `UPDATE` si ya existe) de Estación 2600 en `spaces` con
  `service_categories = ['music_production', 'audiovisual_production_space',
  'equipment_rental']` y `status='draft'`.

Nada fuera de esta lista. No se toca `service_categories` de los otros
aliados, no se toca ninguna tabla de Plataforma de Espacio
(`space_rooms`, etc.) — Estación 2600 no tiene salones cargados todavía,
eso es trabajo de Andrés en `/workspace/espacio` cuando quiera.

## 4. Decisiones ya tomadas

- Publicar los cuatro ya, sin esperar a que tengan contenido — decisión
  explícita de Andrés (2026-09-17), contra la recomendación por defecto de
  esperar.
- Estación 2600 se carga en `draft`, no `published` — es un aliado nuevo sin
  ningún contenido todavía en Plataforma de Espacio; sigue el mismo patrón
  que los otros cuatro tuvieron al momento de su alta (migración 044).
- `service_categories` de Estación 2600: `music_production` (estudio,
  masterización, mezcla) + `audiovisual_production_space` (ensayo, podcast)
  + `equipment_rental`. **No incluye** una categoría de "gestión cultural"
  — Andrés aclaró explícitamente que eso no es un servicio de espacio sino
  un rol de actor (Gestor cultural), y ese es un tema aparte, todavía sin
  spec, documentado en `EL CULEBREO - Aliados y modelo de
  necesidades-servicios (borrador).md`.
- No se crea ninguna categoría nueva en el vocabulario cerrado de
  `service_categories` (`database/044_actor_service_categories.sql`) en
  esta spec.

## 5. Cómo se verifica

1. Andrés corre la migración 048 contra Supabase (SQL Editor).
2. `select name, status, service_categories from spaces where name in ('Stainless Space','Oasis','Taller 108','Club del Cafe','Estación 2600');`
   — los cuatro primeros en `published`, Estación 2600 en `draft` con las
   tres categorías.
3. `/ecosistema` muestra "4 perfiles" en la sección Espacios (Estación 2600
   no cuenta porque sigue en `draft`).
4. `/workspace/espacio` con la cuenta de super_admin muestra los cinco en
   el selector (el filtro es por `service_categories`, no por `status`).

## 6. Qué no se toca

- El vocabulario cerrado de `service_categories` (sigue en 12 valores).
- `role_type` (sigue solo en `funders`, sin valor `gestor`) — ese es el
  tema pendiente, no esta spec.
- Plataforma de Espacio (`space_rooms`, calendario, bloques de 2 horas) —
  Estación 2600 no tiene salones cargados; eso es trabajo manual de Andrés
  en `/workspace/espacio`, no de esta migración.
