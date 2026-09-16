-- ============================================================
-- CULTURA ESTA
-- Migración 044
-- Categorías de servicio para aliados (funders y spaces) y
-- carga de los seis aliados fundacionales
-- ============================================================

begin;

-- ============================================================
-- 1. COLUMNA DE CATEGORÍAS DE SERVICIO (FUNDERS)
-- ============================================================

alter table public.funders
add column if not exists service_categories text[] not null default '{}'
  check (
    service_categories <@ array[
      'audiovisual_production_space','events_space','coworking_space',
      'music_production','equipment_rental','graphic_design',
      'merch_printing','printing_services','workshops_mentorship',
      'tattoo','funding','marketing_activations'
    ]::text[]
  );

-- ============================================================
-- 2. COLUMNA DE CATEGORÍAS DE SERVICIO (SPACES)
-- ============================================================

alter table public.spaces
add column if not exists service_categories text[] not null default '{}'
  check (
    service_categories <@ array[
      'audiovisual_production_space','events_space','coworking_space',
      'music_production','equipment_rental','graphic_design',
      'merch_printing','printing_services','workshops_mentorship',
      'tattoo','funding','marketing_activations'
    ]::text[]
  );

-- ============================================================
-- 3. CARGA DE LOS SEIS ALIADOS FUNDACIONALES
-- ============================================================

do $$
declare
  v_imagine_id uuid;
  v_ocb_id uuid;
  v_hojalata_id uuid;
  v_hojalata_existed boolean;
  v_stainless_id uuid;
  v_stainless_existed boolean;
  v_oasis_id uuid;
  v_oasis_existed boolean;
  v_taller108_id uuid;
  v_taller108_existed boolean;
  v_clubdelcafe_id uuid;
  v_clubdelcafe_existed boolean;
begin
  -- ------------------------------------------------------------
  -- 3.1 funders.Imagine -> ['marketing_activations']
  -- ------------------------------------------------------------

  select id into v_imagine_id
  from public.funders
  where name ilike '%imagine%'
  limit 1;

  if v_imagine_id is null then
    raise notice 'Imagine: NO existe como fila en funders. No se crea (fuera de alcance de esta migración; ya debería existir desde 040_imagine_company_y_music_business_seed.sql).';
  else
    update public.funders
    set service_categories = array['marketing_activations']
    where id = v_imagine_id;

    raise notice 'Imagine: ya existía como fila en funders (id=%). service_categories actualizado a marketing_activations.', v_imagine_id;
  end if;

  -- ------------------------------------------------------------
  -- 3.2 funders.OCB -> ['funding']
  -- ------------------------------------------------------------

  select id into v_ocb_id
  from public.funders
  where name ilike '%ocb%'
  limit 1;

  if v_ocb_id is null then
    raise notice 'OCB: NO existe como fila en funders hoy. Esta migración NO lo crea (pendiente, según la spec). Queda pendiente cargar service_categories = funding cuando la fila exista.';
  else
    update public.funders
    set service_categories = array['funding']
    where id = v_ocb_id;

    raise notice 'OCB: ya existía como fila en funders (id=%). service_categories actualizado a funding.', v_ocb_id;
  end if;

  -- ------------------------------------------------------------
  -- 3.3 spaces.Hojalata -> ['graphic_design', 'merch_printing',
  --     'printing_services', 'workshops_mentorship']
  -- ------------------------------------------------------------

  select id into v_hojalata_id
  from public.spaces
  where name ilike '%hojalata%'
  limit 1;

  v_hojalata_existed := v_hojalata_id is not null;

  if v_hojalata_id is null then
    insert into public.spaces (
      name,
      slug,
      status,
      service_categories
    )
    values (
      'Hojalata',
      public.make_unique_slug('Hojalata'),
      'draft',
      array[
        'graphic_design',
        'merch_printing',
        'printing_services',
        'workshops_mentorship'
      ]
    )
    returning id into v_hojalata_id;
  else
    update public.spaces
    set service_categories = array[
      'graphic_design',
      'merch_printing',
      'printing_services',
      'workshops_mentorship'
    ]
    where id = v_hojalata_id;
  end if;

  raise notice 'Hojalata: % como fila en spaces (id=%). service_categories actualizado.',
    case when v_hojalata_existed then 'ya existía' else 'se creó' end,
    v_hojalata_id;

  -- ------------------------------------------------------------
  -- 3.4 spaces.'Stainless Space' -> ['audiovisual_production_space',
  --     'events_space', 'coworking_space', 'music_production',
  --     'equipment_rental']
  -- ------------------------------------------------------------

  select id into v_stainless_id
  from public.spaces
  where name ilike '%stainless%'
  limit 1;

  v_stainless_existed := v_stainless_id is not null;

  if v_stainless_id is null then
    insert into public.spaces (
      name,
      slug,
      status,
      service_categories
    )
    values (
      'Stainless Space',
      public.make_unique_slug('Stainless Space'),
      'draft',
      array[
        'audiovisual_production_space',
        'events_space',
        'coworking_space',
        'music_production',
        'equipment_rental'
      ]
    )
    returning id into v_stainless_id;
  else
    update public.spaces
    set service_categories = array[
      'audiovisual_production_space',
      'events_space',
      'coworking_space',
      'music_production',
      'equipment_rental'
    ]
    where id = v_stainless_id;
  end if;

  raise notice 'Stainless Space: % como fila en spaces (id=%). service_categories actualizado.',
    case when v_stainless_existed then 'ya existía' else 'se creó' end,
    v_stainless_id;

  -- ------------------------------------------------------------
  -- 3.5 spaces.Oasis -> ['audiovisual_production_space',
  --     'events_space', 'music_production', 'equipment_rental']
  -- ------------------------------------------------------------

  select id into v_oasis_id
  from public.spaces
  where name ilike '%oasis%'
  limit 1;

  v_oasis_existed := v_oasis_id is not null;

  if v_oasis_id is null then
    insert into public.spaces (
      name,
      slug,
      status,
      service_categories
    )
    values (
      'Oasis',
      public.make_unique_slug('Oasis'),
      'draft',
      array[
        'audiovisual_production_space',
        'events_space',
        'music_production',
        'equipment_rental'
      ]
    )
    returning id into v_oasis_id;
  else
    update public.spaces
    set service_categories = array[
      'audiovisual_production_space',
      'events_space',
      'music_production',
      'equipment_rental'
    ]
    where id = v_oasis_id;
  end if;

  raise notice 'Oasis: % como fila en spaces (id=%). service_categories actualizado.',
    case when v_oasis_existed then 'ya existía' else 'se creó' end,
    v_oasis_id;

  -- ------------------------------------------------------------
  -- 3.6 spaces.'Taller 108' -> ['audiovisual_production_space',
  --     'events_space', 'music_production', 'tattoo']
  -- ------------------------------------------------------------

  select id into v_taller108_id
  from public.spaces
  where name ilike '%taller 108%'
  limit 1;

  v_taller108_existed := v_taller108_id is not null;

  if v_taller108_id is null then
    insert into public.spaces (
      name,
      slug,
      status,
      service_categories
    )
    values (
      'Taller 108',
      public.make_unique_slug('Taller 108'),
      'draft',
      array[
        'audiovisual_production_space',
        'events_space',
        'music_production',
        'tattoo'
      ]
    )
    returning id into v_taller108_id;
  else
    update public.spaces
    set service_categories = array[
      'audiovisual_production_space',
      'events_space',
      'music_production',
      'tattoo'
    ]
    where id = v_taller108_id;
  end if;

  raise notice 'Taller 108: % como fila en spaces (id=%). service_categories actualizado.',
    case when v_taller108_existed then 'ya existía' else 'se creó' end,
    v_taller108_id;

  -- ------------------------------------------------------------
  -- 3.7 spaces.'Club del Cafe' -> ['events_space']
  -- ------------------------------------------------------------

  select id into v_clubdelcafe_id
  from public.spaces
  where name ilike '%club del caf%'
  limit 1;

  v_clubdelcafe_existed := v_clubdelcafe_id is not null;

  if v_clubdelcafe_id is null then
    insert into public.spaces (
      name,
      slug,
      status,
      service_categories
    )
    values (
      'Club del Cafe',
      public.make_unique_slug('Club del Cafe'),
      'draft',
      array['events_space']
    )
    returning id into v_clubdelcafe_id;
  else
    update public.spaces
    set service_categories = array['events_space']
    where id = v_clubdelcafe_id;
  end if;

  raise notice 'Club del Cafe: % como fila en spaces (id=%). service_categories actualizado.',
    case when v_clubdelcafe_existed then 'ya existía' else 'se creó' end,
    v_clubdelcafe_id;

  -- ------------------------------------------------------------
  -- 3.8 Resumen de cierre (criterio de aceptación 5)
  -- ------------------------------------------------------------

  raise notice '--- RESUMEN CIERRE MIGRACIÓN 044 ---';
  raise notice 'Imagine (funders): % (id=%)',
    case when v_imagine_id is null then 'NO existe' else 'existía' end,
    v_imagine_id;
  raise notice 'OCB (funders): %',
    case when v_ocb_id is null then 'NO existe como fila en funders hoy' else format('existe (id=%s)', v_ocb_id) end;
  raise notice 'Hojalata (spaces): %', case when v_hojalata_existed then 'existía' else 'se creó' end;
  raise notice 'Stainless Space (spaces): %', case when v_stainless_existed then 'existía' else 'se creó' end;
  raise notice 'Oasis (spaces): %', case when v_oasis_existed then 'existía' else 'se creó' end;
  raise notice 'Taller 108 (spaces): %', case when v_taller108_existed then 'existía' else 'se creó' end;
  raise notice 'Club del Cafe (spaces): %', case when v_clubdelcafe_existed then 'existía' else 'se creó' end;
end $$;

commit;
