import type { NextRequest } from 'next/server';

import { handleRoute } from '@/lib/validation/adminWriteAuth';
import { createTicketType, toggleTicketType } from '@/services/admin/ticketingService';

export async function POST(request: NextRequest) {
  return handleRoute(async () => createTicketType(await request.json()));
}

export async function PATCH(request: NextRequest) {
  return handleRoute(async () => toggleTicketType(await request.json()));
}
