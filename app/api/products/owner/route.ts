import type { NextRequest } from 'next/server';

import { handleRoute } from '@/lib/validation/adminWriteAuth';
import { createOwnedProduct, proposeOwnedProduct } from '@/services/products/productOwnerService';

export async function POST(request: NextRequest) {
  return handleRoute(async () => createOwnedProduct(await request.json()));
}

export async function PATCH(request: NextRequest) {
  return handleRoute(async () => proposeOwnedProduct(await request.json()));
}
