# Spec: categorias de servicio para aliados (funders y spaces) y carga de los seis aliados fundacionales

## 1. Objetivo
Agregar una columna de categorias de servicio, con vocabulario fijo y
validado, a funders y a spaces, y cargar los datos reales de los seis
aliados fundacionales confirmados por Andres.

## 2. Por que ahora
El gate isAgency de WorkspaceHome.tsx se corrigio comparando nombre ("imagine")
en vez de preguntar que servicios ofrece el actor. La correccion real necesita
que el actor tenga una lista de categorias de servicio, y que esa lista pueda
existir tanto en funders como en spaces (Stainless Space, Oasis, Taller 108,
Club del Cafe son spaces, no funders). El vocabulario de categorias fue
validado por Andres contra los seis aliados reales, no inventado.

## 3. Archivos
- database/044_actor_service_categories.sql (nuevo): agrega columna
  service_categories a funders y a spaces, con check constraint contra el
  vocabulario fijo. Inserta/actualiza los seis aliados con sus categorias
  reales.
- No se toca ningun componente ni servicio de lectura en esta fase — nada en
  la UI consume esta columna todavia. Eso es la Fase 2 (necesidades del
  proyecto) y la Fase 3 (superficie visible), specs separadas.

## 4. Fuera de alcance
- No se construye el motor de emparejamiento necesidad-servicio (Fase 3).
- No se agrega "necesidades" a ProjectTools (Fase 2).
- No se toca funder_type ni role_type — ejes existentes, sin cambios.
- No se toca isAgency ni ningun componente de WorkspaceHome.tsx.
- No se construye flujo de registro de aliados con formulario — la carga de
  los seis aliados es una migracion de datos, no un formulario nuevo.

## 5. Decisiones ya tomadas
Vocabulario fijo, en este orden y con este texto exacto (clave estable para
el check constraint, en ingles/snake_case; la tabla en espanol de arriba es
la referencia legible):

    'audiovisual_production_space'   -- Espacio para grabacion/produccion audiovisual
    'events_space'                    -- Espacio para eventos y activaciones
    'coworking_space'                 -- Espacio de coworking
    'music_production'                -- Produccion y grabacion musical
    'equipment_rental'                 -- Renta de equipos
    'graphic_design'                   -- Diseno grafico y de marca
    'merch_printing'                   -- Estampado y confeccion de merch
    'printing_services'                -- Impresion (textil, papel, etc.)
    'workshops_mentorship'             -- Talleres, clases, acompanamiento
    'tattoo'                           -- Tatuajes
    'funding'                          -- Financiacion / convocatorias
    'marketing_activations'            -- Marketing, BTL, lanzamientos

Carga de datos (service_categories, segun la tabla aprobada por Andres):
- funders.Imagine -> ['marketing_activations']
- funders.OCB -> ['funding']  (si OCB no existe todavia como fila en funders,
  este spec NO lo crea — se anota como pendiente en el reporte de cierre)
- spaces.Hojalata -> ['graphic_design', 'merch_printing', 'printing_services',
  'workshops_mentorship']  (si Hojalata todavia no existe como fila, se crea
  con name/slug/status='draft' y esta columna, igual que el patron de
  handle_new_user para status inicial)
- spaces.'Stainless Space' -> ['audiovisual_production_space', 'events_space',
  'coworking_space', 'music_production', 'equipment_rental']
- spaces.Oasis -> ['audiovisual_production_space', 'events_space',
  'music_production', 'equipment_rental']
- spaces.'Taller 108' -> ['audiovisual_production_space', 'events_space',
  'music_production', 'tattoo']
- spaces.'Club del Cafe' -> ['events_space']

Para los otros cuatro aliados que son spaces (Stainless Space, Oasis, Taller
108, Club del Cafe) aplica el mismo criterio que para Hojalata: si la fila no
existe por nombre, se crea con name/slug/status='draft' y la columna de
categorias; si existe, se actualiza. El reporte de cierre dice cuales de los
seis existian y cuales se crearon (criterio de aceptacion 5).

## 6. Interfaces y contratos
Columna nueva en ambas tablas:

    service_categories text[] not null default '{}'
      check (service_categories <@ array[
        'audiovisual_production_space','events_space','coworking_space',
        'music_production','equipment_rental','graphic_design',
        'merch_printing','printing_services','workshops_mentorship',
        'tattoo','funding','marketing_activations'
      ]::text[])

## 7. Tests que van a romperse a proposito
Ninguno. Es una columna nueva con default vacio — no afecta ninguna fila ni
lectura existente.

## 8. Criterio de aceptacion verificable
1. La migracion corre sin error contra la base de datos de desarrollo.
2. select service_categories from funders where name ilike '%imagine%' regresa
   ['marketing_activations'].
3. select service_categories from spaces where name ilike '%hojalata%'
   regresa las cuatro categorias listadas arriba.
4. Insertar un valor fuera del vocabulario (ej. 'categoria_inventada') en
   cualquiera de las dos columnas falla por el check constraint.
5. El reporte de cierre dice explicitamente cuales de los seis aliados ya
   existian como fila y cuales se tuvieron que crear, y si OCB existe o no
   como fila en funders hoy.

## 9. Que queda deterministico y por que
Todo: es una migracion de datos con un vocabulario fijo, sin inferencia ni
IA. El check constraint garantiza que nunca se guarda una categoria fuera
del vocabulario aprobado.
