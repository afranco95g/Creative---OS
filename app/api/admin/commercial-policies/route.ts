import type { NextRequest } from 'next/server';

import { handleRoute } from '@/lib/validation/adminWriteAuth';
import { updateMaximumProductSharePolicy } from '@/services/admin/commercialPolicyService';

export async function POST(request: NextRequest) {
  return handleRoute(async () => updateMaximumProductSharePolicy(await request.json()));
}
