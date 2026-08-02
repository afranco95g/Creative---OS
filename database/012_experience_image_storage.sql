-- ============================================================
-- CULTURA ESTA
-- Migración 012
-- Almacenamiento de imágenes de experiencias
-- ============================================================

begin;

-- ============================================================
-- 1. CREAR BUCKET PÚBLICO
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'experience-images',
  'experience-images',
  true,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- 2. ELIMINAR POLÍTICAS ANTERIORES
-- ============================================================

drop policy if exists
  "Public can read experience images"
on storage.objects;

drop policy if exists
  "Users can upload experience images"
on storage.objects;

drop policy if exists
  "Users can update their experience images"
on storage.objects;

drop policy if exists
  "Users can delete their experience images"
on storage.objects;

-- ============================================================
-- 3. LECTURA PÚBLICA
-- ============================================================

create policy
  "Public can read experience images"
on storage.objects
for select
to public
using (
  bucket_id = 'experience-images'
);

-- ============================================================
-- 4. CARGA DE ARCHIVOS
-- ============================================================

create policy
  "Users can upload experience images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'experience-images'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

-- ============================================================
-- 5. ACTUALIZACIÓN DE ARCHIVOS PROPIOS
-- ============================================================

create policy
  "Users can update their experience images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'experience-images'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
)
with check (
  bucket_id = 'experience-images'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

-- ============================================================
-- 6. ELIMINACIÓN DE ARCHIVOS PROPIOS
-- ============================================================

create policy
  "Users can delete their experience images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'experience-images'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

commit;