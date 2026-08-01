import type {
  EntityAction,
  EntityActionVariant,
} from './schema-definition';

export interface ResolvedAction
  extends EntityAction {
  enabled: boolean;

  visible: boolean;

  variant: EntityActionVariant;

  confirmationRequired: boolean;
}