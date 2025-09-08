// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";        // must not be 'edge'
export const dynamic = "force-dynamic"; // avoid caching

import { headers } from "next/headers";
import Stripe from "stripe";
import * as admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

export async function POST(req: Request) {
  // 1) Verify signature using the RAW body
  const sig = headers().get("stripe-signature") || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(raw),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("constructEvent error:", err?.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const uid = s.metadata?.firebaseUid as string | undefined;
        const vehicleId = s.metadata?.vehicleId as string | undefined;
        const subscriptionId = s.subscription as string | undefined;

        if (uid && vehicleId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await db.doc(`users/${uid}/vehicles/${vehicleId}/membership`).set(
            {
              status: sub.status,
              subscriptionId: sub.id,
              customerId: (sub.customer as string) || (s.customer as string),
              priceId: sub.items.data[0]?.price?.id || null,
              current_period_end: sub.current_period_end * 1000,
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // Keep matching membership docs in sync
        const snap = await db
          .collectionGroup("membership")
          .where("subscriptionId", "==", sub.id)
          .get();

        if (!snap.empty) {
          await Promise.all(
            snap.docs.map((d) =>
              d.ref.set(
                {
                  status: sub.status,
                  current_period_end: sub.current_period_end * 1000,
                  updatedAt: Date.now(),
                },
                { merge: true }
              )
            )
          );
        }
        break;
      }

      default:
        // ignore other events
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (e: any) {
    console.error("Webhook handler error:", e?.message || e);
    return new Response("Internal error", { status: 500 });
  }
}


