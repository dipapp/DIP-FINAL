export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  console.log("[ping] hit", Date.now());
  return new Response("pong", { status: 200 });
}




