begin;

-- El portal conserva los proyectos antes de permitir su eliminación.
-- La transición sigue protegida por propiedad y RLS.
create or replace function public.allow_owner_project_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.owner_id = auth.uid() and (
    (new.workflow_status = 'archived' and old.workflow_status <> 'published')
    or (old.workflow_status = 'archived' and new.workflow_status = 'private')
  ) then
    return new;
  end if;
  raise exception 'La transición de archivo solicitada no está permitida';
end;
$$;

drop trigger if exists projects_allow_owner_lifecycle on public.projects;
create trigger projects_allow_owner_lifecycle
before update on public.projects
for each row
when (
  new.workflow_status = 'archived'
  or (old.workflow_status = 'archived' and new.workflow_status = 'private')
)
execute function public.allow_owner_project_lifecycle();

-- Conserva todas las reglas históricas y excluye únicamente las transiciones
-- de ciclo de vida, que valida el trigger anterior.
drop trigger if exists projects_enforce_workflow on public.projects;
drop trigger if exists projects_enforce_workflow_insert on public.projects;
drop trigger if exists projects_enforce_workflow_update on public.projects;

create trigger projects_enforce_workflow_insert
before insert on public.projects
for each row execute function public.enforce_project_workflow();

create trigger projects_enforce_workflow_update
before update on public.projects
for each row
when (
  new.workflow_status <> 'archived'
  and not (old.workflow_status = 'archived' and new.workflow_status = 'private')
)
execute function public.enforce_project_workflow();

drop policy if exists "Owners can delete private projects" on public.projects;
create policy "Owners can delete private projects"
on public.projects for delete to authenticated
using (
  owner_id = auth.uid()
  and workflow_status in ('private','eligibility_rejected','publication_rejected','archived')
);

commit;
