import type {
  EntityFieldConfig,
} from '../types/entity-config';

interface EntityTableProps {
  records: unknown[];
  fields: EntityFieldConfig[];
}

type EntityRecord = Record<string, unknown>;

function formatValue(
  value: unknown,
  field: EntityFieldConfig,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  switch (field.type) {
    case 'date': {
      const date = new Date(String(value));

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
      }).format(date);
    }

    case 'boolean':
      return value ? 'Sí' : 'No';

    case 'number': {
      const number = Number(value);

      if (Number.isNaN(number)) {
        return String(value);
      }

      return new Intl.NumberFormat(
        'es-CO',
      ).format(number);
    }

    default:
      return String(value);
  }
}

export function EntityTable({
  records,
  fields,
}: EntityTableProps) {
  const visibleFields = fields.filter(
    (field) => field.visibleInList,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-800">
          <thead className="bg-neutral-900">
            <tr>
              {visibleFields.map((field) => (
                <th
                  key={field.key}
                  scope="col"
                  className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-neutral-500"
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800 bg-neutral-950">
            {records.map((record, index) => {
              const currentRecord =
                record as EntityRecord;

              const recordKey =
                typeof currentRecord.id ===
                'string'
                  ? currentRecord.id
                  : index;

              return (
                <tr
                  key={recordKey}
                  className="transition-colors hover:bg-neutral-900"
                >
                  {visibleFields.map(
                    (field) => {
                      const value =
                        currentRecord[
                          field.key
                        ];

                      return (
                        <td
                          key={field.key}
                          className="whitespace-nowrap px-5 py-4 text-sm text-neutral-300"
                        >
                          {field.type ===
                            'email' &&
                          value ? (
                            <a
                              href={`mailto:${String(
                                value,
                              )}`}
                              className="text-white underline-offset-4 hover:underline"
                            >
                              {String(value)}
                            </a>
                          ) : (
                            formatValue(
                              value,
                              field,
                            )
                          )}
                        </td>
                      );
                    },
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}