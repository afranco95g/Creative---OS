import type { NextRequest } from 'next/server';

import { handleRoute } from '@/lib/validation/adminWriteAuth';
import { createCalendarEntry, updateCalendarEntry } from '@/services/admin/calendarEntryService';

export async function POST(request: NextRequest) {
  return handleRoute(async () => createCalendarEntry(await request.json()));
}

export async function PATCH(request: NextRequest) {
  return handleRoute(async () => updateCalendarEntry(await request.json()));
}
