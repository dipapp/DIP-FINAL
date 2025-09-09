// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";        // ensure Node runtime
export const dynamic = "force-dynamic"; // disable caching

import Stripe from "stripe";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      } as any),
    });
  }
  return getAdminFirestore();
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !signingSecret) {
    return new Response("Stripe env vars missing", { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  // Raw body required for signature verification
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(raw), sig!, signingSecret);
  } catch (err: any) {
    console.error("[webhook] signature error:", err?.message);
    return new Response(`Webhook Error: ${err?.message ?? "bad signature"}`, { status: 400 });
  }

  const db = initAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[stripe] webhook checkout.session.completed", {
          sessionId: session.id,
          vehicleId: session.metadata?.vehicleId,
          userId: session.metadata?.userId,
          subscriptionId: session.subscription,
          customer: session.customer,
        });

        const vehicleId = (session.metadata?.vehicleId as string) || undefined;
        const userId = (session.metadata?.userId as string) || undefined;
        const vin = (session.metadata?.vin as string) || undefined;
        const licensePlate = (session.metadata?.licensePlate as string) || undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerId = (session.customer as string) || undefined;

        if (vehicleId) {
          await db.collection("vehicles").doc(vehicleId).update({
            // Do not mark active here; wait for subscription.created/updated after payment
            stripe: {
              customerId: customerId || null,
              subscriptionId: subscriptionId || null,
              checkoutSessionId: session.id,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Ensure the initial subscription item created by Checkout is tagged with vehicleId
        try {
          if (subscriptionId && vehicleId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items"] });
            const firstItem = sub.items?.data?.[0];
            if (firstItem) {
              const currentMeta = (firstItem.metadata || {}) as any;
              await stripe.subscriptionItems.update(firstItem.id, {
                metadata: {
                  ...currentMeta,
                  vehicleId: vehicleId as string,
                  vin: typeof vin === "string" ? vin : currentMeta.vin || "",
                  licensePlate: typeof licensePlate === "string" ? licensePlate : currentMeta.licensePlate || "",
                },
              });
            }
          }
        } catch (e) {
          console.error("Failed to attach vehicleId metadata to subscription item", e);
        }

        // Store customerId on the user doc (no single subscriptionId at user level)
        if (userId && customerId) {
          const userRef = db.collection("users").doc(userId);
          const snap = await userRef.get();
          if (snap.exists) {
            const existing = snap.data() || {};
            await userRef.set(
              {
                stripe: {
                  ...(existing.stripe || {}),
                  customerId: customerId || existing?.stripe?.customerId || null,
                },
                updatedAt: new Date(),
              },
              { merge: true }
            );
          } else {
            await userRef.set(
              {
                stripe: { customerId: customerId || null },
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { merge: true }
            );
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        console.log("[stripe] webhook subscription event", event.type);
        const sub = event.data.object as Stripe.Subscription;
        const vehicleId = (sub.metadata?.vehicleId as string) || undefined;
        // Multi-item model: iterate items and update vehicles based on item metadata.vehicleId
        const items = sub.items?.data || [];
        let matchedAny = false;
        for (const it of items) {
          const vId = (it.metadata?.vehicleId as string) || undefined;
          if (!vId) continue;
          matchedAny = true;
          console.log("[stripe] updating vehicle from item", { vId, itemId: it.id, status: sub.status });
          await db.collection("vehicles").doc(vId).update({
            isActive: sub.status === "active" || sub.status === "trialing",
            stripe: {
              customerId: sub.customer as string,
              subscriptionId: sub.id,
              subscriptionItemId: it.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        // Fallback to subscription-level metadata
        if (!matchedAny && vehicleId) {
          console.log("[stripe] updating vehicle from subscription-level metadata", { vehicleId, status: sub.status });
          await db.collection("vehicles").doc(vehicleId).update({
            isActive: sub.status === "active" || sub.status === "trialing",
            stripe: {
              customerId: sub.customer as string,
              subscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("Error handling webhook", e);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


