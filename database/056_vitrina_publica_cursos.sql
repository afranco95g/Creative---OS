-- ============================================================
-- CULTURA ESTA / EL CULEBREO
-- Migración 056
-- Vitrina pública de cursos: precio y forma de pago visibles
-- para cualquiera, sin abrir el contenido de las lecciones.
--
-- Por qué no se usa "status = 'published'" para esto: la política
-- "Public can view lessons of published courses" (migración 039) ya
-- hace público el contenido completo de las lecciones en cuanto un
-- curso pasa a status='published'. Un curso pago (como Music
-- Business) debe quedarse en status='draft' aunque quiera mostrarse
-- en la vitrina pública -- por eso esta migración agrega un campo
-- independiente en vez de tocar el significado de "status".
-- ============================================================

begin;

alter table public.courses
  add column if not exists publicly_listed boolean not null default false;

comment on column public.courses.publicly_listed is
  'Si es true, el curso aparece en la vitrina pública (existencia, precio, forma de pago) aunque el contenido siga sin ser público. Independiente de "status": status=published además abre las lecciones a cualquiera, así que un curso pago debe quedarse en status=draft aunque publicly_listed=true.';

drop view if exists public.course_public_teasers;

create view public.course_public_teasers as
select
  c.id,
  c.owner_actor_id,
  c.title,
  c.description,
  c.price,
  c.payment_structure,
  c.certification_enabled
from public.courses c
where c.publicly_listed = true;

grant select on public.course_public_teasers to anon, authenticated;

update public.courses
set publicly_listed = true
where title = 'Music Business';

commit;
