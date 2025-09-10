// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";        // ensure Node runtime
export const dynamic = "force-dynamic"; // disable caching

import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  // Minimal route to verify deployment and signature; returns 200
  const sig = headers().get("stripe-signature");
  const raw = await req.text();

  try {
    stripe.webhooks.constructEvent(
      Buffer.from(raw),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("[webhook] verified signature at", Date.now());
  } catch (err: any) {
    console.error("[webhook] signature error:", err?.message);
    return new Response(`Webhook Error: ${err?.message ?? "bad signature"}`, { status: 400 });
  }

  return new Response("ok", { status: 200 });
}

// For health checks and quick verification
export async function HEAD() {
  return new Response('ok', { status: 200 });
}

export async function GET() {
  return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'POST, HEAD' } });
}


