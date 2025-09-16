import { NextRequest, NextResponse } from 'next/server';

// Deprecated: Single-quantity subscription model removed. This endpoint is disabled.
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Deprecated endpoint. Per-vehicle subscriptions do not use quantity sync.' }, { status: 410 });
}