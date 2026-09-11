import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { getStripeClient, stripeConfig, isStripeConfigured } from "@/config/stripe";
import { processWebhookEvent } from "@/services/stripe/stripeService";
import logger from "@/lib/logger/logger";

// Stripe requires the raw, unparsed request body to verify the signature —
// req.text() (not req.json()) is what makes constructEvent's HMAC check
// actually valid. Never trust a webhook body that hasn't passed this check.
export async function POST(req) {
  if (!isStripeConfigured() || !stripeConfig.webhookSecret) {
    logger.warn("Stripe webhook received but Stripe/webhook secret is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeConfig.webhookSecret);
  } catch (err) {
    logger.error(`Stripe webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await connectDB();
    await processWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error(`Stripe webhook processing error (event ${event.id}, type ${event.type}): ${err.message}`);
    // 500 tells Stripe to retry — safe, since processing is idempotent per event.id
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
