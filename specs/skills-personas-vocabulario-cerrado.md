# Spec: vocabulario cerrado para `people.skills`

## 1. Objetivo

`people.skills` deja de ser texto libre y se convierte en un vocabulario
cerrado de habilidades de producción (curado, no extensible por el usuario),
con el mismo patrón que `service_categories` (`people.roles` ya sigue este
patrón — constraint en la base + lista fija en el código). Una persona puede
tener varias habilidades a la vez.

## 2. Por qué ahora

Andrés confirmó (2026-09-17) que el motor de emparejamiento
necesidad↔servicio necesita que las habilidades de las personas sean
comparables entre sí — hoy `skills` es texto libre (`TagField`, cualquiera
escribe lo que quiera: "fotografo", "Fotógrafo profesional", etc.), lo que
hace imposible cruzar "el proyecto necesita fotógrafo" contra personas
reales. Pidió explícitamente investigar los roles reales de distintos tipos
de producción (audiovisual, música, eventos, gestión cultural) para construir
ese vocabulario, y confirmó tres decisiones: (1) vocabulario curado, cerrado,
como `service_categories`; (2) una persona puede tener varias habilidades;
(3) construir ya.

**Nota de origen del vocabulario:** a diferencia de `service_categories`
(construido desde los servicios reales de los seis aliados fundacionales),
esta lista se construyó desde investigación de roles estándar de industria
(audiovisual, música, eventos, gestión cultural comunitaria — fuentes en el
documento de Aliados, sección 10), porque hoy no hay suficientes perfiles de
personas reales cargados para derivarlo de ahí. Es una excepción explícita
al principio de "vocabulario construido desde abajo" — Andrés debe poder
corregir/podar esta lista con el mismo criterio con que corrigió el
service_categories original si algo no encaja.

## 3. Archivos que se crean o se modifican

- `database/049_people_skills_vocabulario_cerrado.sql` — nuevo. Diagnóstico
  (RAISE NOTICE de cualquier valor de `skills` ya en la base que no esté en
  el vocabulario nuevo, sin borrar nada) + `ALTER TABLE people ADD
  CONSTRAINT people_skills_vocab_check CHECK (skills <@ array[...])`. Si
  algún dato real viola el constraint, la migración completa falla y no
  aplica nada (transacción `begin/commit`) — es intencional, ver sección 9.
- `services/ecosystem/personProfileService.ts` — se agrega la constante
  exportada `PERSON_SKILLS` (mismo formato `[key, label] as const` que
  `PERSON_ROLES` en `MyEcosystemDashboard.tsx`) y una función
  `sanitizeSkills(values: string[])` que filtra contra ese vocabulario antes
  de enviar el payload (defensa en profundidad — el constraint de la base es
  la fuente de verdad, esto evita un error de guardado innecesario si el
  cliente manda basura).
- `components/MyEcosystemDashboard.tsx` — el campo "Habilidades" deja de ser
  `TagField` (texto libre) y se vuelve una lista de botones tipo toggle,
  igual que "Roles creativos" (mismo bloque de estilos, mismo patrón
  `active`/`onClick`), usando `PERSON_SKILLS` importado del servicio. Se
  quita `skillsText`/`splitTags` para skills (sigue igual para `interests`,
  que no cambia).
- `app/ecosistema/[actorType]/[slug]/page.tsx` — el `InformationCard` que
  muestra `actor.offers` (habilidades públicas) humaniza cada valor
  (`snake_case` → "Snake Case") igual que ya hace `formatLabel` en
  `app/ecosistema/page.tsx` para `labels` — se replica esa función local
  (o se extrae a un helper compartido si ya existe uno; si no, se define
  localmente en este archivo, no se crea un módulo nuevo solo para esto).

## 4. Fuera de alcance

- `people.roles` no se toca — ya tiene su propio constraint y vocabulario,
  correcto tal como está.
- No se limpia ni se transforma dato existente en `skills` que no encaje en
  el vocabulario nuevo — si existe, la migración falla y se reporta (sección
  9), no se decide en código qué hacer con esos valores.
- No se construye ningún cruce automático entre `skills` y
  `service_categories`/necesidades de proyecto (eso es Fase 2/3 del motor de
  aliados, documento aparte).
- No se resuelve la superposición conceptual entre `roles` (categorías
  amplias: fotógrafo, gestor/a, productor/a) y `skills` (más finas:
  producción ejecutiva, gestión cultural comunitaria, masterización) — es
  una redundancia leve y aceptada, no un blocker para esta entrega.
- No se toca `funders.role_type` ni se agrega el valor `gestor` ahí — es un
  tema distinto (documento de Aliados, sección 8), sigue pendiente de
  encuadre.

## 5. Decisiones ya tomadas

Vocabulario cerrado de `skills` (30 valores, clave estable / etiqueta):

Audiovisual: `direccion_audiovisual` (Dirección), `produccion_ejecutiva`
(Producción ejecutiva), `produccion_de_campo` (Producción de campo),
`asistencia_de_direccion` (Asistencia de dirección),
`direccion_de_fotografia` (Dirección de fotografía), `camara_videografia`
(Cámara / realización audiovisual), `fotografia` (Fotografía),
`edicion_audiovisual` (Edición audiovisual), `colorizacion` (Colorización),
`direccion_de_arte` (Dirección de arte), `vestuario` (Vestuario),
`maquillaje_caracterizacion` (Maquillaje / caracterización), `sonido_directo`
(Sonido directo), `diseno_sonoro_postproduccion` (Diseño sonoro /
postproducción de audio), `iluminacion_gaffer` (Iluminación / gaffer).

Música: `produccion_musical` (Producción musical), `masterizacion_mezcla`
(Masterización y mezcla), `ingenieria_sonido_en_vivo` (Ingeniería de sonido
en vivo), `composicion_arreglos` (Composición y arreglos), `tour_management`
(Tour management).

Eventos: `produccion_de_eventos` (Producción de eventos),
`logistica_de_eventos` (Logística de eventos), `jefatura_tecnica_eventos`
(Jefatura técnica de eventos).

Gestión y mediación cultural: `gestion_cultural_comunitaria` (Gestión
cultural comunitaria), `mediacion_cultural` (Mediación cultural),
`investigacion_territorial` (Investigación territorial), `curaduria`
(Curaduría).

Diseño y oficio: `diseno_grafico` (Diseño gráfico), `ilustracion`
(Ilustración), `produccion_de_merch` (Producción de merch).

- El constraint se llama `people_skills_vocab_check`.
- `PERSON_SKILLS` vive en `services/ecosystem/personProfileService.ts`, no
  en el componente — a diferencia de `PERSON_ROLES` (que sigue donde está,
  no se mueve, no forma parte de esta entrega).
- El toggle de habilidades usa exactamente las mismas clases Tailwind que ya
  usa el toggle de roles en `MyEcosystemDashboard.tsx` (línea ~785) — no se
  inventa un estilo nuevo.
- Humanización de `snake_case` a texto: reemplazar `_` por espacio y
  capitalizar cada palabra — igual que `formatLabel` en
  `app/ecosistema/page.tsx`.

## 6. Interfaces y contratos que hay que respetar

- `PersonProfileInput.skills: string[]` (tipo ya existente) no cambia de
  forma — sigue siendo `string[]`, solo que ahora los valores válidos están
  acotados por `PERSON_SKILLS`.
- `updateMyPersonProfile()` sigue con la misma firma.
- `list_published_ecosystem_actors()` / `get_published_ecosystem_actor()`
  (SQL, `database/009_public_ecosystem.sql`) no cambian — siguen devolviendo
  `people.skills` tal cual en la columna `offers`.

## 7. Tests que van a romperse a propósito

Ninguno — no hay test de TypeScript que cubra `personProfileService.ts` ni
`MyEcosystemDashboard.tsx` hoy (`grep -rl "personProfileService\|MyEcosystemDashboard" **/*.test.*` vacío, confirmar en verificación).

## 8. Criterio de aceptación verificable

1. `npm run typecheck` — sin errores.
2. `npm test` — las 14 suites existentes en verde, sin modificar ningún test.
3. `grep -n "PERSON_SKILLS" services/ecosystem/personProfileService.ts` —
   presente, con exactamente 30 entradas.
4. `grep -n "TagField label=\"Habilidades\"" components/MyEcosystemDashboard.tsx`
   — ya no existe (se reemplazó por el toggle).
5. `npx eslint services/ecosystem/personProfileService.ts components/MyEcosystemDashboard.tsx "app/ecosistema/[actorType]/[slug]/page.tsx"`
   — 0 errores nuevos.
6. Lectura de diff: el constraint en `database/049_...sql` usa exactamente
   los 30 valores de la sección 5, ni uno más ni uno menos.
7. Andrés corre la migración 049 en Supabase y confirma si aplicó sin error
   (si falla, es porque hay datos reales fuera del vocabulario — se resuelve
   ajustando el vocabulario, no forzando el dato).

## 9. Qué queda determinista y por qué

Todo el vocabulario es una lista fija, comparada con `<@` (subconjunto) en
Postgres — determinista y auditable, igual que `service_categories`. No hay
interpretación de texto libre en ningún punto de esta entrega: la UI ya no
permite escribir texto libre para habilidades (se reemplaza el `TagField`
por selección de botones), así que no hace falta ninguna capa de
interpretación. La migración falla explícitamente (no silenciosamente) si
hay datos reales que no encajan — decisión deliberada: preferimos que
Andrés vea el error y decida (¿el vocabulario está incompleto? ¿el dato era
ruido?) a que la migración borre datos de perfiles reales sin avisar.
