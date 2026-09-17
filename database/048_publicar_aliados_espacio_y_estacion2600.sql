-- ============================================================
-- CULTURA ESTA
-- Migración 048
-- Publicar los cuatro aliados-espacio piloto y cargar
-- Estación 2600 como nuevo aliado-espacio
-- ============================================================

begin;

-- ============================================================
-- 1. PUBLICAR LOS CUATRO ALIADOS-ESPACIO YA CARGADOS
-- ============================================================
-- Decisión de Andrés (2026-09-17): publicarlos ya en el
-- directorio público /ecosistema, aunque todavía no tengan
-- salones/inventario/fotos cargados en Plataforma de Espacio.

do $$
declare
  v_updated_count integer;
begin
  update public.spaces
  set status = 'published'
  where name in ('Stainless Space', 'Oasis', 'Taller 108', 'Club del Cafe')
    and status <> 'published';

  get diagnostics v_updated_count = row_count;

  raise notice 'Publicados % de los cuatro aliados-espacio (los que ya estaban en published no se tocan).', v_updated_count;
end $$;

-- ============================================================
-- 2. NUEVO ALIADO-ESPACIO: ESTACIÓN 2600
-- ============================================================
-- Estudio de producción musical: espacios de ensayo para
-- proyectos acústicos, producción de podcast, servicios de
-- masterización y mezcla. Se carga en 'draft' — mismo patrón
-- que los otros cuatro al momento de su alta (migración 044):
-- primero se crea la fila, se publica cuando tenga contenido
-- real cargado en Plataforma de Espacio.
--
-- Nota: "gestión cultural", mencionado por Andrés junto con
-- Estación 2600, NO se carga aquí como service_category. Andrés
-- aclaró que no es un servicio de espacio sino un rol de actor
-- distinto (Gestor cultural) — ver
-- 'EL CULEBREO - Aliados y modelo de necesidades-servicios
-- (borrador).md' para la decisión pendiente sobre cómo modelarlo.

do $$
declare
  v_estacion2600_id uuid;
  v_estacion2600_existed boolean;
begin
  select id into v_estacion2600_id
  from public.spaces
  where name ilike '%estaci%n 2600%' or name ilike '%estacion 2600%'
  limit 1;

  v_estacion2600_existed := v_estacion2600_id is not null;

  if v_estacion2600_id is null then
    insert into public.spaces (
      name,
      slug,
      status,
      service_categories
    )
    values (
      'Estación 2600',
      public.make_unique_slug('Estación 2600'),
      'draft',
      array[
        'music_production',
        'audiovisual_production_space',
        'equipment_rental'
      ]
    )
    returning id into v_estacion2600_id;
  else
    update public.spaces
    set service_categories = array[
      'music_production',
      'audiovisual_production_space',
      'equipment_rental'
    ]
    where id = v_estacion2600_id;
  end if;

  raise notice 'Estación 2600: % como fila en spaces (id=%). service_categories cargado. status=draft (publicar manualmente cuando tenga contenido).',
    case when v_estacion2600_existed then 'ya existía' else 'se creó' end,
    v_estacion2600_id;
end $$;

commit;
