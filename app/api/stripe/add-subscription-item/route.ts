import { NextRequest, NextResponse } from 'next/server';

// Deprecated: Per-vehicle subscriptions are created via Checkout. This endpoint is disabled.
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Deprecated endpoint. Use /api/stripe/create-checkout-session per vehicle.' }, { status: 410 });
}