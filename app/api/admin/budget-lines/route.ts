import type { NextRequest } from 'next/server';

import { handleRoute } from '@/lib/validation/adminWriteAuth';
import { createBudgetLine, updateBudgetLineStatus, upsertFinancialScenario } from '@/services/admin/budgetLineService';

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const body = await request.json();
    if (body.resource === 'scenario') return upsertFinancialScenario(body.payload);
    return createBudgetLine(body.payload);
  });
}

export async function PATCH(request: NextRequest) {
  return handleRoute(async () => {
    const body = await request.json();
    return updateBudgetLineStatus(body);
  });
}
