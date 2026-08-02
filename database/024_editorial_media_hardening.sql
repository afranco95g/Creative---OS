begin;

alter table public.editorial_media_assets drop constraint if exists editorial_media_assets_mime_type_check;
alter table public.editorial_media_assets add constraint editorial_media_assets_mime_type_check
  check (mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm'));
alter table public.editorial_media_assets drop constraint if exists editorial_media_assets_size_bytes_check;
alter table public.editorial_media_assets add constraint editorial_media_assets_size_bytes_check
  check (size_bytes > 0 and size_bytes <= 104857600);

create or replace function public.audit_editorial_media_asset()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.current_profile_role() not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos editoriales'; end if;
  if tg_op='INSERT' then new.created_by:=auth.uid(); end if;
  new.updated_at:=now();
  return new;
end;$$;
drop trigger if exists editorial_media_assets_audit on public.editorial_media_assets;
create trigger editorial_media_assets_audit before insert or update on public.editorial_media_assets
for each row execute function public.audit_editorial_media_asset();

create or replace function public.enforce_editorial_post_permissions()
returns trigger language plpgsql security definer set search_path = '' as $$
declare role_name text := coalesce(public.current_profile_role(), 'anonymous');
begin
  if role_name not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos editoriales'; end if;
  if tg_op='INSERT' then new.created_by:=auth.uid(); end if;
  new.updated_by:=auth.uid(); new.updated_at:=now();
  if new.status in ('published','scheduled') and role_name not in ('media_admin','super_admin') then raise exception 'Solo un administrador del medio puede publicar o programar'; end if;
  if new.status in ('published','scheduled') then
    if nullif(trim(new.title),'') is null or nullif(trim(new.excerpt),'') is null or
       nullif(trim(coalesce(new.cover_image_url,'')),'') is null or
       nullif(trim(coalesce(new.cover_image_alt,'')),'') is null then
      raise exception 'Título, resumen, imagen principal y texto alternativo son obligatorios';
    end if;
    if new.status='scheduled' and (new.publish_at is null or new.publish_at<=now()) then raise exception 'La fecha programada debe ser futura'; end if;
  end if;
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
    new.published_at:=coalesce(new.published_at,now()); new.publish_at:=coalesce(new.publish_at,now()); new.published_by:=auth.uid();
  end if;
  return new;
end;$$;

update storage.buckets set file_size_limit=104857600,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
where id='editorial-media';

-- La beta no elimina archivos físicos desde el navegador. Primero se comprueba
-- uso en editorial_media_assets y luego un administrador realiza la limpieza.
drop policy if exists "Editorial admins delete media files" on storage.objects;

commit;
