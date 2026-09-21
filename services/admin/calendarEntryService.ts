import { z } from 'zod';

import { HttpError, requireCapability } from '@/lib/validation/adminWriteAuth';

export interface CalendarEntry {
  id: string; project_id: string; title: string; entry_type: string;
  starts_at: string; status: string; visibility: string;
}

// Gate: /admin/calendario exige capabilities.canManageEcosystem — mismo
// requisito aquí.
const CreateEntryInput = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  entry_type: z.enum([
    'milestone', 'task', 'payment', 'production', 'delivery', 'editorial',
    'campaign', 'ticket_open', 'ticket_close', 'deadline',
  ]),
  starts_at: z.string().datetime(),
  visibility: z.enum(['ecosystem', 'private']).default('ecosystem'),
});

export async function createCalendarEntry(raw: unknown) {
  const ctx = await requireCapability('canManageEcosystem');
  const input = CreateEntryInput.parse(raw);
  const { data, error } = await ctx.supabase
    .from('project_calendar_entries')
    .insert(input)
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as CalendarEntry;
}

const UpdateEntryInput = z.union([
  z.object({ id: z.string().uuid(), starts_at: z.string().datetime() }),
  z.object({ id: z.string().uuid(), status: z.literal('cancelled') }),
]);

export async function updateCalendarEntry(raw: unknown) {
  const ctx = await requireCapability('canManageEcosystem');
  const input = UpdateEntryInput.parse(raw);
  const { id, ...patch } = input;
  const { data, error } = await ctx.supabase
    .from('project_calendar_entries')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as CalendarEntry;
}
