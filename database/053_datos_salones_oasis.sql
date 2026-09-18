-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 053
-- Alta de datos (no de esquema): los 4 salones de Oasis que ya
-- tienen material listo para publicar (Salón 1, 2, 3 y
-- Parqueadero). Sala 5, Sala 6 y Salón 4 quedan pendientes.
--
-- Busca el espacio "Oasis" por nombre (ilike '%oasis%'), no por
-- slug exacto. Sin bloque `do $$ ... $$` a propósito: al copiar
-- y pegar en el editor SQL de Supabase, el `$$` se corrompió y
-- la primera versión de esta migración falló por eso. Esta
-- versión es un solo INSERT con un JOIN, sin `$$`, más segura de
-- copiar y pegar en el navegador.
--
-- Modelo: Oasis es UN espacio (`spaces`), cada salón es un
-- "subespacio" (`space_rooms`) dentro de él — cada uno con su
-- propia galería y su propio botón de reserva independiente
-- (ya construido en la migración 045, `list_room_availability` +
-- `space_booking_requests` funcionan por salón, no por edificio).
--
-- El Parqueadero no tiene capacidad en personas (el campo
-- `capacity` de `space_rooms` es para eso) sino en vehículos, así
-- que se deja `capacity` en null y el número de carros se anota
-- en la descripción — no hay otro campo hoy para modelarlo.
--
-- Después de correrla, revisa que diga "Success. X rows
-- affected" con X = 4. Si dice 0, es porque no encontró ningún
-- espacio con "oasis" en el nombre — revisa el nombre real en
-- la tabla `spaces` y avísame.
-- ============================================================

begin;

insert into public.space_rooms (space_id, name, slug, description, capacity, possible_uses, status)
select
  s.id,
  v.name,
  v.slug,
  v.description,
  v.capacity,
  v.possible_uses,
  'draft'
from (
  select id
  from public.spaces
  where name ilike '%oasis%'
  order by created_at asc
  limit 1
) as s
join (
  values
    (
      'Salón 1',
      'salon-1',
      'Salón principal del edificio Oasis, para hasta 200 personas. Equipado para transmisión, grabación, eventos en vivo, charlas, talleres y cursos.',
      200,
      array['transmision', 'grabacion', 'evento_en_vivo', 'charla', 'taller', 'curso']
    ),
    (
      'Salón 2',
      'salon-2',
      'Salón para hasta 150 personas. Equipado para transmisión, grabación, eventos en vivo, charlas, talleres y cursos.',
      150,
      array['transmision', 'grabacion', 'evento_en_vivo', 'charla', 'taller', 'curso']
    ),
    (
      'Salón 3',
      'salon-3',
      'Salón para hasta 150 personas. Equipado para transmisión, grabación, eventos en vivo, charlas, talleres y cursos.',
      150,
      array['transmision', 'grabacion', 'evento_en_vivo', 'charla', 'taller', 'curso']
    ),
    (
      'Parqueadero',
      'parqueadero',
      'Parqueadero subterráneo del edificio, con capacidad para 25 vehículos.',
      25,
      array['parqueo']
    )
) as v(name, slug, description, capacity, possible_uses)
  on true
on conflict (space_id, slug) do nothing;

commit;
