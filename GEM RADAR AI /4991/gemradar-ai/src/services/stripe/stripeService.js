import { getStripeClient, stripeConfig } from "@/config/stripe";
import { priceIdForPlan, planFromStripePriceId } from "@/services/subscription/subscriptionService";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import SystemSetting from "@/models/SystemSetting";
import logger from "@/lib/logger/logger";

const VALID_PLANS = ["pro", "pro_plus"];

// Creates (or reuses) the Stripe customer for this user, then a Checkout
// Session for the requested plan. The plan name comes from our own
// VALID_PLANS check + priceIdForPlan lookup — never from a client-supplied
// price ID — so a user cannot request an arbitrary/privileged price.
export async function createCheckoutSession(user, plan, baseUrl) {
  if (!VALID_PLANS.includes(plan)) {
    throw new Error(`Invalid plan "${plan}". Choose "pro" or "pro_plus".`);
  }
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    throw new Error(`Stripe price ID for "${plan}" is not configured. Set STRIPE_${plan.toUpperCase()}_PRICE_ID in .env`);
  }

  const stripe = getStripeClient();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() }
    });
    customerId = customer.id;
    await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user._id.toString(),
    metadata: { userId: user._id.toString(), plan },
    subscription_data: { metadata: { userId: user._id.toString(), plan } },
    success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/subscription/cancel`
  });

  return session;
}

export async function createPortalSession(user, baseUrl) {
  if (!user.stripeCustomerId) {
    throw new Error("No billing account found yet. Subscribe to a plan first.");
  }
  const stripe = getStripeClient();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/subscription`
  });
  return portal;
}

// --- Webhook idempotency -----------------------------------------------
// Stripe can and does redeliver the same event. We reuse SystemSetting as a
// generic key/value store rather than introducing a dedicated model for
// this — one row per processed event ID, keyed distinctly so it never
// collides with real settings.
async function isEventProcessed(eventId) {
  const existing = await SystemSetting.findOne({ key: `stripe_event_${eventId}` });
  return Boolean(existing);
}
async function markEventProcessed(eventId) {
  try {
    await SystemSetting.create({ key: `stripe_event_${eventId}`, value: { processedAt: new Date() } });
  } catch {
    // Duplicate key under a race — the event is already marked, which is exactly what we want.
  }
}

// --- Webhook event handlers ----------------------------------------------
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  const plan = session.metadata?.plan;
  if (!userId || !plan) {
    logger.warn(`checkout.session.completed missing userId/plan metadata (session ${session.id})`);
    return;
  }

  const stripe = getStripeClient();
  const subscriptionId = session.subscription;
  let stripeSubscription = null;
  if (subscriptionId) {
    stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  }

  await User.findByIdAndUpdate(userId, {
    subscriptionTier: plan,
    subscriptionStatus: stripeSubscription?.status || "active",
    stripeCustomerId: session.customer
  });

  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      plan,
      status: stripeSubscription?.status || "active",
      stripeSubscriptionId: subscriptionId || undefined,
      stripePriceId: stripeSubscription?.items?.data?.[0]?.price?.id,
      currentPeriodStart: stripeSubscription ? new Date(stripeSubscription.current_period_start * 1000) : undefined,
      currentPeriodEnd: stripeSubscription ? new Date(stripeSubscription.current_period_end * 1000) : undefined,
      cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false
    },
    { upsert: true }
  );

  if (session.payment_status === "paid") {
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: session.payment_intent || session.id },
      {
        user: userId,
        stripePaymentIntentId: session.payment_intent || session.id,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || "usd",
        status: "succeeded",
        plan
      },
      { upsert: true }
    );
  }

  logger.info(`Checkout completed for user ${userId} — plan ${plan}`);
}

async function handleSubscriptionUpdated(stripeSubscription) {
  const priceId = stripeSubscription.items?.data?.[0]?.price?.id;
  const plan = planFromStripePriceId(priceId) || stripeSubscription.metadata?.plan;
  const userId = stripeSubscription.metadata?.userId;

  const updatePayload = {
    status: stripeSubscription.status,
    stripePriceId: priceId,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
  };
  if (plan) updatePayload.plan = plan;

  const subDoc = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: stripeSubscription.id },
    updatePayload,
    { new: true }
  );

  const targetUserId = userId || subDoc?.user;
  if (!targetUserId) {
    logger.warn(`customer.subscription.updated with no resolvable user (subscription ${stripeSubscription.id})`);
    return;
  }

  // Effective plan is computed from tier + status at authorization time
  // (see subscriptionService.getEffectivePlan), so it's safe to keep the
  // tier on the user record for history even while status reflects reality.
  await User.findByIdAndUpdate(targetUserId, {
    subscriptionStatus: stripeSubscription.status,
    ...(plan ? { subscriptionTier: plan } : {})
  });
}

async function handleSubscriptionDeleted(stripeSubscription) {
  const subDoc = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: stripeSubscription.id },
    { status: "canceled", cancelAtPeriodEnd: false },
    { new: true }
  );
  const userId = stripeSubscription.metadata?.userId || subDoc?.user;
  if (userId) {
    await User.findByIdAndUpdate(userId, { subscriptionStatus: "canceled" });
  }
}

async function handleInvoicePaid(invoice) {
  const userId = invoice.subscription_details?.metadata?.userId;
  if (!userId) return; // nothing to attribute this invoice to
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: invoice.payment_intent || invoice.id },
    {
      user: userId,
      stripePaymentIntentId: invoice.payment_intent || invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency || "usd",
      status: "succeeded"
    },
    { upsert: true }
  );
}

async function handleInvoicePaymentFailed(invoice) {
  const userId = invoice.subscription_details?.metadata?.userId;
  if (userId) {
    await User.findByIdAndUpdate(userId, { subscriptionStatus: "past_due" });
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: invoice.payment_intent || invoice.id },
      {
        user: userId,
        stripePaymentIntentId: invoice.payment_intent || invoice.id,
        amount: (invoice.amount_due || 0) / 100,
        currency: invoice.currency || "usd",
        status: "failed"
      },
      { upsert: true }
    );
  }
}

export async function processWebhookEvent(event) {
  if (await isEventProcessed(event.id)) {
    logger.info(`Stripe event ${event.id} already processed — skipping (idempotent redelivery)`);
    return { skipped: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  await markEventProcessed(event.id);
  return { skipped: false };
}
