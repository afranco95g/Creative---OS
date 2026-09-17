-- ============================================================
-- CULTURA ESTA
-- Migración 049
-- Vocabulario cerrado para people.skills (habilidades de
-- producción), mismo patrón que service_categories y que el
-- constraint ya existente de people.roles.
-- ============================================================

begin;

-- ============================================================
-- 1. DIAGNÓSTICO — no destructivo, solo informativo
-- ============================================================
-- Si algún valor real en la base no cae dentro del vocabulario
-- nuevo, se reporta aquí. El paso 2 va a fallar en ese caso (el
-- constraint no aplica), y la transacción completa se revierte
-- — no se pierde ningún dato. Es intencional: ver spec
-- `specs/skills-personas-vocabulario-cerrado.md`, sección 9.

do $$
declare
  v_offending record;
  v_found boolean := false;
begin
  for v_offending in
    select
      people.id,
      people.full_name,
      unnest(people.skills) as skill_value
    from public.people
    where not (
      people.skills <@ array[
        'direccion_audiovisual','produccion_ejecutiva','produccion_de_campo',
        'asistencia_de_direccion','direccion_de_fotografia','camara_videografia',
        'fotografia','edicion_audiovisual','colorizacion','direccion_de_arte',
        'vestuario','maquillaje_caracterizacion','sonido_directo',
        'diseno_sonoro_postproduccion','iluminacion_gaffer',
        'produccion_musical','masterizacion_mezcla','ingenieria_sonido_en_vivo',
        'composicion_arreglos','tour_management',
        'produccion_de_eventos','logistica_de_eventos','jefatura_tecnica_eventos',
        'gestion_cultural_comunitaria','mediacion_cultural',
        'investigacion_territorial','curaduria',
        'diseno_grafico','ilustracion','produccion_de_merch'
      ]::text[]
    )
  loop
    v_found := true;

    raise notice 'FUERA DE VOCABULARIO: persona "%" (id=%) tiene el valor "%" en skills, que no está en el vocabulario nuevo.',
      v_offending.full_name, v_offending.id, v_offending.skill_value;
  end loop;

  if not v_found then
    raise notice 'Diagnóstico: todos los valores actuales de people.skills ya caen dentro del vocabulario nuevo. El constraint del paso 2 debería aplicar sin problema.';
  end if;
end $$;

-- ============================================================
-- 2. CONSTRAINT — vocabulario cerrado
-- ============================================================

alter table public.people
add constraint people_skills_vocab_check
  check (
    skills <@ array[
      'direccion_audiovisual','produccion_ejecutiva','produccion_de_campo',
      'asistencia_de_direccion','direccion_de_fotografia','camara_videografia',
      'fotografia','edicion_audiovisual','colorizacion','direccion_de_arte',
      'vestuario','maquillaje_caracterizacion','sonido_directo',
      'diseno_sonoro_postproduccion','iluminacion_gaffer',
      'produccion_musical','masterizacion_mezcla','ingenieria_sonido_en_vivo',
      'composicion_arreglos','tour_management',
      'produccion_de_eventos','logistica_de_eventos','jefatura_tecnica_eventos',
      'gestion_cultural_comunitaria','mediacion_cultural',
      'investigacion_territorial','curaduria',
      'diseno_grafico','ilustracion','produccion_de_merch'
    ]::text[]
  );

commit;
