import type { NextRequest } from 'next/server';

import { handleRoute } from '@/lib/validation/adminWriteAuth';
import { createTaxRule, toggleTaxRule } from '@/services/admin/taxRuleService';

export async function POST(request: NextRequest) {
  return handleRoute(async () => createTaxRule(await request.json()));
}

export async function PATCH(request: NextRequest) {
  return handleRoute(async () => toggleTaxRule(await request.json()));
}
