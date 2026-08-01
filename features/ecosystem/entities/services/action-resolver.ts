import type {
  EntityAction,
  EntityActionScope,
  EntityPermissions,
  SchemaDefinition,
} from '../types/schema-definition';

import type { ResolvedAction } from '../types/resolved-action';

const defaultActions: EntityAction[] = [
  {
    id: 'create',
    label: 'Crear',
    scope: 'collection',
    permission: 'create',
    variant: 'primary',
  },
  {
    id: 'edit',
    label: 'Editar',
    scope: 'record',
    permission: 'update',
  },
  {
    id: 'delete',
    label: 'Eliminar',
    scope: 'record',
    permission: 'delete',
    variant: 'destructive',
    requiresConfirmation: true,
  },
];

export class ActionResolver {
  resolve(
    schema: SchemaDefinition,
    scope: EntityActionScope
  ): ResolvedAction[] {
    const schemaActions: EntityAction[] =
      schema.actions ?? [];

    const permissions: EntityPermissions =
      schema.permissions ?? {};

    const actions: EntityAction[] = [
      ...defaultActions,
      ...schemaActions,
    ];

    return actions
      .filter(
        (action) =>
          action.scope === scope
      )
      .map((action): ResolvedAction => {
        const hasPermission =
          !action.permission ||
          permissions[action.permission] ===
            true;

        return {
          ...action,

          enabled: hasPermission,

          visible: hasPermission,

          variant:
            action.variant ?? 'default',

          confirmationRequired:
            action.requiresConfirmation ??
            false,
        };
      });
  }
}

export const actionResolver =
  new ActionResolver();