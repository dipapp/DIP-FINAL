// app/api/stripe/webhook/route.ts
export const runtime = 'nodejs';          // ensure Node, not Edge
export const dynamic = 'force-dynamic';   // no caching

export async function POST(req: Request) {
  const text = await req.text().catch(() => '');
  console.log('[WEBHOOK TEST] received body:', text);
  return new Response('ok', { status: 200 });
}

// (Optional) A GET handler solely for debugging:
export async function GET() {
  return new Response('webhook GET ok', { status: 200 });
}
