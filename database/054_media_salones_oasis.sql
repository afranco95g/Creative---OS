-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 054
-- Alta de datos: registra en `space_media` los archivos que ya
-- subiste al bucket `space-media` (Storage) para Salón 1, 2, 3 y
-- Parqueadero de Oasis.
--
-- CÓRRELA DESPUÉS de subir los archivos al bucket y DESPUÉS de
-- que la migración 053 haya creado los salones. Los
-- `storage_path` de abajo asumen que subiste cada archivo dentro
-- de una carpeta con el slug del salón (ej.
-- salon-1/Video_salon_1.mp4). Si subiste con otra ruta, corrige
-- el texto entre comillas antes de correr.
--
-- Sin bloque `do $$ ... $$` — un solo INSERT con JOIN, para que
-- copiar/pegar en el editor de Supabase no lo rompa (eso fue lo
-- que falló con la migración 053 la primera vez).
--
-- Después de correrla, revisa que diga "Success. X rows
-- affected" con X = 27 (10 de salón 1 + 7 de salón 2 + 7 de
-- salón 3 + 3 de parqueadero -- cada número es 1 video + N
-- fotos).
-- ============================================================

begin;

insert into public.space_media (room_id, media_type, storage_path, display_order)
select
  r.id,
  v.media_type,
  v.storage_path,
  v.display_order
from (
  select sr.id, sr.slug
  from public.space_rooms sr
  join public.spaces s on s.id = sr.space_id
  where s.name ilike '%oasis%'
) as r
join (
  values
    ('salon-1', 'video', 'salon-1/Video_salon_1.mp4', 0),
    ('salon-1', 'photo', 'salon-1/foto_1.1.jpg', 1),
    ('salon-1', 'photo', 'salon-1/foto_1.2.jpg', 2),
    ('salon-1', 'photo', 'salon-1/foto_1.3.jpg', 3),
    ('salon-1', 'photo', 'salon-1/foto_1.4.jpg', 4),
    ('salon-1', 'photo', 'salon-1/foto_1.5.jpg', 5),
    ('salon-1', 'photo', 'salon-1/foto_1.6.jpg', 6),
    ('salon-1', 'photo', 'salon-1/foto_1.7.jpg', 7),
    ('salon-1', 'photo', 'salon-1/foto_1.8.jpg', 8),
    ('salon-1', 'photo', 'salon-1/foto_1.9.jpg', 9),
    ('salon-2', 'video', 'salon-2/Video_salon_2.mp4', 0),
    ('salon-2', 'photo', 'salon-2/Foto_2.1.jpg', 1),
    ('salon-2', 'photo', 'salon-2/foto_2.2.jpg', 2),
    ('salon-2', 'photo', 'salon-2/foto_2.3.jpg', 3),
    ('salon-2', 'photo', 'salon-2/foto_2.4.jpg', 4),
    ('salon-2', 'photo', 'salon-2/foto_2.5.jpg', 5),
    ('salon-2', 'photo', 'salon-2/foto_2.6.jpg', 6),
    ('salon-3', 'video', 'salon-3/Video_salon_3.mp4', 0),
    ('salon-3', 'photo', 'salon-3/foto_3.1.jpg', 1),
    ('salon-3', 'photo', 'salon-3/foto_3.2.jpg', 2),
    ('salon-3', 'photo', 'salon-3/foto_3.3.jpg', 3),
    ('salon-3', 'photo', 'salon-3/foto_3.4.jpg', 4),
    ('salon-3', 'photo', 'salon-3/foto_3.5.jpg', 5),
    ('salon-3', 'photo', 'salon-3/foto_3.6.jpg', 6),
    ('parqueadero', 'video', 'parqueadero/video_parqueadero.mp4', 0),
    ('parqueadero', 'photo', 'parqueadero/Foto_par1_1.1.1.jpg', 1),
    ('parqueadero', 'photo', 'parqueadero/Foto_par2_1.2.1.jpg', 2)
) as v(room_slug, media_type, storage_path, display_order)
  on v.room_slug = r.slug;

commit;
