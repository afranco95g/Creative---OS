'use client';

import type {
  EntityActionScope,
  EntityActionVariant,
} from '../types/schema-definition';

import { useSchema } from '../context';
import { actionResolver } from '../services/action-resolver';

interface EntityActionsProps {
  scope: EntityActionScope;

  onAction?: (
    actionId: string
  ) => void;
}

export function EntityActions({
  scope,
  onAction,
}: EntityActionsProps) {
  const { schema } = useSchema();

  const actions =
    actionResolver.resolve(
      schema,
      scope
    );

  return (
    <div className="flex flex-wrap gap-2">
      {actions
        .filter(
          (action) => action.visible
        )
        .map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={!action.enabled}
            onClick={() =>
              onAction?.(action.id)
            }
            className={getButtonClass(
              action.variant
            )}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}

function getButtonClass(
  variant: EntityActionVariant
): string {
  switch (variant) {
    case 'primary':
      return [
        'rounded-md',
        'bg-primary',
        'px-4',
        'py-2',
        'text-primary-foreground',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50',
      ].join(' ');

    case 'destructive':
      return [
        'rounded-md',
        'bg-destructive',
        'px-4',
        'py-2',
        'text-destructive-foreground',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50',
      ].join(' ');

    default:
      return [
        'rounded-md',
        'border',
        'px-4',
        'py-2',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50',
      ].join(' ');
  }
}