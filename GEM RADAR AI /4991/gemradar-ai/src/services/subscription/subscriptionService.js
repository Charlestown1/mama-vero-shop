import { stripeConfig } from "@/config/stripe";

// Single source of truth for what each plan includes. Every route in the app
// checks access through the functions below rather than comparing
// user.subscriptionTier directly — that keeps "what can Free/Pro/Pro+ do" in
// exactly one place.
export const PLAN_LIMITS = {
  free: {
    scansPerDay: 5,
    aiResearchPerDay: 2,
    watchlists: 1,
    alerts: 3,
    telegramAlerts: false,
    smartMoney: false,
    portfolioAiAnalysis: false,
    marketAiSummary: false,
    researchHistoryDays: 7
  },
  pro: {
    scansPerDay: 200,
    aiResearchPerDay: 50,
    watchlists: 10,
    alerts: 50,
    telegramAlerts: true,
    smartMoney: true,
    portfolioAiAnalysis: true,
    marketAiSummary: true,
    researchHistoryDays: Infinity
  },
  pro_plus: {
    scansPerDay: Infinity,
    aiResearchPerDay: Infinity,
    watchlists: Infinity,
    alerts: Infinity,
    telegramAlerts: true,
    smartMoney: true,
    portfolioAiAnalysis: true,
    marketAiSummary: true,
    researchHistoryDays: Infinity
  }
};

export const PLAN_PRICING = {
  free: { label: "Free", priceUsd: 0, interval: null },
  pro: { label: "Pro", priceUsd: 9.99, interval: "month" },
  pro_plus: { label: "Pro+ / Alpha", priceUsd: 19.99, interval: "month" }
};

export const PLAN_FEATURE_COPY = {
  free: ["Basic market dashboard", "Limited gem scans", "Limited AI research", "Basic watchlist", "Basic risk scanner"],
  pro: ["Unlimited AI research", "Advanced gem scanner", "Smart-money & whale tracking", "AI portfolio analysis", "Custom alerts + Telegram", "Full research history"],
  pro_plus: ["Everything in Pro", "Highest daily limits", "Priority scanning cadence", "Advanced AI reports", "Full research history"]
};

const ACTIVE_STATUSES = ["active", "trialing"];

export function getPlanLimits(planKey) {
  return PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
}

// The plan stored on the user record (subscriptionTier) reflects what they
// signed up for; subscriptionStatus reflects Stripe's live state. A user whose
// subscription lapsed (canceled/past_due/none) is NOT entitled to paid
// features even if subscriptionTier still says "pro" — that field is kept for
// historical/display purposes and updated back to "free" by the webhook
// handler once Stripe confirms cancellation, but this function is the actual
// authorization check and never trusts a stale tier alone.
export function getEffectivePlan(user) {
  if (!user) return "free";
  if (user.subscriptionTier === "free") return "free";
  return ACTIVE_STATUSES.includes(user.subscriptionStatus) ? user.subscriptionTier : "free";
}

export function isSubscriptionActive(user) {
  return getEffectivePlan(user) !== "free" || user?.subscriptionTier === "free";
}

export function canAccessFeature(user, featureKey) {
  const plan = getEffectivePlan(user);
  return Boolean(getPlanLimits(plan)[featureKey]);
}

export function getLimit(user, limitKey) {
  const plan = getEffectivePlan(user);
  return getPlanLimits(plan)[limitKey];
}

// Thrown by feature/limit checks; API routes catch this specifically to
// return a clean 403 with an upgrade path instead of a generic 500.
export class UpgradeRequiredError extends Error {
  constructor(message, requiredPlan) {
    super(message);
    this.name = "UpgradeRequiredError";
    this.code = "UPGRADE_REQUIRED";
    this.requiredPlan = requiredPlan;
  }
}

export function assertFeatureAccess(user, featureKey, featureLabel) {
  if (!canAccessFeature(user, featureKey)) {
    const requiredPlan = PLAN_LIMITS.pro[featureKey] ? "pro" : "pro_plus";
    throw new UpgradeRequiredError(
      `${featureLabel || featureKey} requires the ${PLAN_PRICING[requiredPlan].label} plan or higher.`,
      requiredPlan
    );
  }
}

export function planFromStripePriceId(priceId) {
  if (priceId === stripeConfig.priceIds.pro) return "pro";
  if (priceId === stripeConfig.priceIds.pro_plus) return "pro_plus";
  return null;
}

export function priceIdForPlan(planKey) {
  return stripeConfig.priceIds[planKey] || null;
}
