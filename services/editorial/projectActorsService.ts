import {
  supabase,
} from '../../lib/supabase/client';

export type ProjectActorType =
  | 'person'
  | 'space'
  | 'funder';

export interface ProjectActorOption {
  actorType: ProjectActorType;
  actorId: string;
  name: string;
  subtitle: string;
  status: string;
}

export interface ProjectActorLink {
  actorType: ProjectActorType;
  actorId: string;
  relationshipLabel: string;
  isPublic: boolean;
  sortOrder: number;
}

interface ActorOptionRow {
  actor_type: ProjectActorType;
  actor_id: string;
  name: string;
  subtitle: string | null;
  actor_status: string;
}

interface ActorLinkRow {
  actor_type: ProjectActorType;
  actor_id: string;
  relationship_label: string;
  is_public: boolean;
  sort_order: number;
}

function getDatabase() {
  return supabase as any;
}

export async function loadProjectActorEditorData(
  projectId: string
): Promise<{
  options: ProjectActorOption[];
  links: ProjectActorLink[];
}> {
  const database =
    getDatabase();

  const [
    optionsResult,
    linksResult,
  ] = await Promise.all([
    database.rpc(
      'list_project_actor_options'
    ),

    database.rpc(
      'get_project_actor_links_for_editor',
      {
        target_project_id:
          projectId,
      }
    ),
  ]);

  if (optionsResult.error) {
    throw new Error(
      optionsResult.error.message ||
        'No fue posible cargar los actores del ecosistema.'
    );
  }

  if (linksResult.error) {
    throw new Error(
      linksResult.error.message ||
        'No fue posible cargar las relaciones del proyecto.'
    );
  }

  const optionRows =
    (
      optionsResult.data ?? []
    ) as ActorOptionRow[];

  const linkRows =
    (
      linksResult.data ?? []
    ) as ActorLinkRow[];

  return {
    options:
      optionRows.map(
        (row) => ({
          actorType:
            row.actor_type,

          actorId:
            row.actor_id,

          name:
            row.name,

          subtitle:
            row.subtitle ?? '',

          status:
            row.actor_status,
        })
      ),

    links:
      linkRows.map(
        (row) => ({
          actorType:
            row.actor_type,

          actorId:
            row.actor_id,

          relationshipLabel:
            row.relationship_label,

          isPublic:
            row.is_public,

          sortOrder:
            row.sort_order,
        })
      ),
  };
}

export async function saveProjectActorLinks(
  projectId: string,
  links: ProjectActorLink[]
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'save_project_actor_links',
    {
      target_project_id:
        projectId,

      actor_links:
        links.map(
          (
            link,
            index
          ) => ({
            actorType:
              link.actorType,

            actorId:
              link.actorId,

            relationshipLabel:
              link.relationshipLabel,

            isPublic:
              link.isPublic,

            sortOrder:
              index,
          })
        ),
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible guardar los actores del proyecto.'
    );
  }
}