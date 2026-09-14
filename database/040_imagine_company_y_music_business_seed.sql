-- ============================================================
-- CULTURA ESTA
-- Migración 040
-- Seed: Imagine Company (agencia) y curso Music Business
-- ============================================================

begin;

do $$
declare
  v_user_id uuid;
  v_funder_id uuid;
  v_course_id uuid;
  v_module_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'imaginecompanysas@gmail.com'
  limit 1;

  if v_user_id is null then
    raise exception
      'Usuario no encontrado en auth.users para email imaginecompanysas@gmail.com — créalo primero en el dashboard de Supabase Auth antes de correr esta migración.';
  end if;

  -- ============================================================
  -- 1. PERFIL
  -- ============================================================

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    onboarding_path,
    onboarding_status,
    is_active
  )
  values (
    v_user_id,
    'imaginecompanysas@gmail.com',
    'Imagine Company',
    'member',
    'agency',
    'completed',
    true
  )
  on conflict (id) do update set
    onboarding_path = 'agency',
    onboarding_status = 'completed';

  -- ============================================================
  -- 2. ACTOR (FUNDERS) — buscar existente o crear
  -- ============================================================

  select id into v_funder_id
  from public.funders
  where created_by = v_user_id
  limit 1;

  if v_funder_id is null then
    insert into public.funders (
      name,
      slug,
      funder_type,
      role_type,
      service_catalog,
      public_email,
      created_by
    )
    values (
      'Imagine Company',
      public.make_unique_slug('Imagine Company'),
      'agency',
      'productor',
      array[
        'Campañas de marketing para marcas/empresas',
        'Activaciones BTL',
        'Programa Music Business'
      ],
      'imaginecompanysas@gmail.com',
      v_user_id
    )
    returning id into v_funder_id;
  else
    update public.funders
    set
      name = 'Imagine Company',
      funder_type = 'agency',
      role_type = 'productor',
      service_catalog = array[
        'Campañas de marketing para marcas/empresas',
        'Activaciones BTL',
        'Programa Music Business'
      ],
      public_email = 'imaginecompanysas@gmail.com'
    where id = v_funder_id;
  end if;

  -- ============================================================
  -- 3. MEMBRESÍA OWNER
  -- ============================================================

  insert into public.funder_memberships (
    funder_id,
    profile_id,
    role,
    status
  )
  values (
    v_funder_id,
    v_user_id,
    'owner',
    'active'
  )
  on conflict (funder_id, profile_id) do update set
    role = 'owner',
    status = 'active';

  -- ============================================================
  -- 4. CURSO MUSIC BUSINESS (6 módulos, 27 lecciones)
  -- ============================================================

  if not exists (
    select 1
    from public.courses
    where owner_actor_id = v_funder_id
      and title = 'Music Business'
  ) then
    insert into public.courses (
      owner_actor_id,
      title,
      description,
      status,
      price,
      payment_structure,
      certification_enabled
    )
    values (
      v_funder_id,
      'Music Business',
      null,
      'draft',
      2100000,
      '2 pagos de 1.050.000 COP',
      false
    )
    returning id into v_course_id;

    -- Módulo 1 — Industria Musical para Principiantes
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Industria Musical para Principiantes', 0)
    returning id into v_module_id;

    insert into public.course_lessons (module_id, title, content_type, content_body, position)
    values
      (v_module_id, 'Exploración del medio musical local, nacional e internacional', 'step_by_step', '', 0),
      (v_module_id, 'Definición de identidad sonora y visual', 'step_by_step', '', 1),
      (v_module_id, 'Proceso creativo: composición, arreglos y producción', 'step_by_step', '', 2),
      (v_module_id, 'Construcción de marca y narrativa artística', 'step_by_step', '', 3),
      (v_module_id, 'Monetización en plataformas digitales', 'step_by_step', '', 4);

    -- Módulo 2 — Fundamentos de Mercadeo y Operaciones
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Fundamentos de Mercadeo y Operaciones', 1)
    returning id into v_module_id;

    insert into public.course_lessons (module_id, title, content_type, content_body, position)
    values
      (v_module_id, 'Herramientas de marketing tradicional y digital', 'step_by_step', '', 0),
      (v_module_id, 'Diseño de documentación ejecutiva (contratos, bases de datos)', 'step_by_step', '', 1),
      (v_module_id, 'Presupuestos para disco, comunicación, shows, campañas', 'step_by_step', '', 2),
      (v_module_id, 'Estructura de equipo y organigrama', 'step_by_step', '', 3),
      (v_module_id, 'Estrategia general e investigación de mercado', 'step_by_step', '', 4),
      (v_module_id, 'Actividad 360: comunicación, infraestructura y promoción', 'step_by_step', '', 5);

    -- Módulo 3 — Publicidad y Comunicación Audiovisual
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Publicidad y Comunicación Audiovisual', 2)
    returning id into v_module_id;

    insert into public.course_lessons (module_id, title, content_type, content_body, position)
    values
      (v_module_id, 'Conceptualización ATL y BTL', 'step_by_step', '', 0),
      (v_module_id, 'Construcción simbólica de mensajes visuales', 'step_by_step', '', 1),
      (v_module_id, 'Diseño estético de recursos digitales para promoción artística', 'step_by_step', '', 2);

    -- Módulo 4 — Estrategia de Promoción y Pauta
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Estrategia de Promoción y Pauta', 3)
    returning id into v_module_id;

    insert into public.course_lessons (module_id, title, content_type, content_body, position)
    values
      (v_module_id, 'Planeación de presupuestos segmentados', 'step_by_step', '', 0),
      (v_module_id, 'Cotizaciones y valorización de producción y campaña', 'step_by_step', '', 1),
      (v_module_id, 'Diseño de estrategias para públicos objetivo', 'step_by_step', '', 2),
      (v_module_id, 'Distribución de pauta en medios y plataformas sociales', 'step_by_step', '', 3);

    -- Módulo 5 — Distribución, sociedades de gestión colectiva y Negociaciones
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Distribución, sociedades de gestión colectiva y Negociaciones', 4)
    returning id into v_module_id;

    insert into public.course_lessons (module_id, title, content_type, content_body, position)
    values
      (v_module_id, 'Distribución digital y física', 'step_by_step', '', 0),
      (v_module_id, 'Negociación con agregadores y patrocinadores', 'step_by_step', '', 1),
      (v_module_id, 'Canales y aplicación de sociedades de gestión colectiva', 'step_by_step', '', 2),
      (v_module_id, 'Establecimiento de rutas de monetización', 'step_by_step', '', 3),
      (v_module_id, 'Coordinación entre lanzamientos y campañas promocionales', 'step_by_step', '', 4);

    -- Módulo 6 — Articulación y Plan de Negocio Final
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Articulación y Plan de Negocio Final', 5)
    returning id into v_module_id;

    insert into public.course_lessons (module_id, title, content_type, content_body, position)
    values
      (v_module_id, 'Desarrollo de cronograma, agenda y metodología operativa', 'step_by_step', '', 0),
      (v_module_id, 'Documento de workflow', 'step_by_step', '', 1),
      (v_module_id, 'Diseño de estrategia de patrocinadores', 'step_by_step', '', 2),
      (v_module_id, 'Construcción y cierre del Business Plan', 'step_by_step', '', 3);
  end if;
end $$;

commit;
