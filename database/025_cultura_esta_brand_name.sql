-- ============================================================
-- CULTURA ESTA
-- Migracion 025
-- Correccion del nombre oficial de la marca
-- ============================================================

begin;

alter table public.editorial_posts
alter column byline set default 'Cultura Esta';

update public.editorial_posts
set byline = replace(byline, 'Cultura Esta', 'Cultura Esta')
where byline like '%Cultura Esta%';

commit;
