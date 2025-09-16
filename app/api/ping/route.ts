export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  console.log("[ping] hit", Date.now());
  return new Response("pong", { status: 200 });
}

export async function GET() {
  return new Response("ok", { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}









