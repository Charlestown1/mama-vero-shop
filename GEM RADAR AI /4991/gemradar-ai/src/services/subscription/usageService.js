import UsageRecord from "@/models/UsageRecord";
import { getLimit, getEffectivePlan } from "./subscriptionService";

// Usage limits (this file) and rate limiting (lib/middleware/rateLimiter.js)
// are deliberately separate concepts: rate limiting protects the server from
// abusive request rates over seconds/minutes and resets constantly; usage
// limits are a subscription entitlement ("5 scans per day") tied to calendar
// days and billed plans. A route can be — and often is — subject to both.
function getPeriodBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function incrementUsage(userId, feature) {
  const { start, end } = getPeriodBounds();
  return UsageRecord.findOneAndUpdate(
    { user: userId, feature, periodStart: start },
    { $inc: { count: 1 }, $setOnInsert: { periodEnd: end } },
    { upsert: true, new: true }
  );
}

// Atomically reserves one use before the caller does the actual work, then
// hands back a commit/release pair:
//   - commit(): the request succeeded — keep the reservation (no-op, since it
//     was already counted by the atomic increment below).
//   - release(): the request failed for a reason unrelated to the user
//     (provider error, AI validation failure, etc.) — refund the reservation
//     so a failed attempt doesn't burn the user's daily quota.
// The increment-then-check ordering (rather than check-then-increment) is
// what actually closes the race two concurrent requests could otherwise use
// to both slip in under the limit.
export async function reserveUsage(user, feature, limitKey) {
  const plan = getEffectivePlan(user);
  const max = getLimit(user, limitKey);

  if (max === Infinity) {
    return { commit: async () => {}, release: async () => {} };
  }

  const { start, end } = getPeriodBounds();
  const record = await UsageRecord.findOneAndUpdate(
    { user: user._id, feature, periodStart: start },
    { $inc: { count: 1 }, $setOnInsert: { periodEnd: end } },
    { upsert: true, new: true }
  );

  if (record.count > max) {
    // Over the limit — refund the increment we just made and reject.
    await UsageRecord.updateOne({ _id: record._id }, { $inc: { count: -1 } });
    const err = new Error(`Daily limit reached for ${feature} on your ${plan} plan. Upgrade for more.`);
    err.code = "USAGE_LIMIT_EXCEEDED";
    throw err;
  }

  return {
    commit: async () => {},
    release: async () => { await UsageRecord.updateOne({ _id: record._id }, { $inc: { count: -1 } }); }
  };
}

// Back-compat wrapper for call sites that only need a yes/no check without
// the reserve/release pattern (kept simple on purpose — most routes should
// prefer reserveUsage so failed AI/provider calls don't cost the user a use).
export async function enforceLimit(user, feature, limitKey) {
  const plan = getEffectivePlan(user);
  const max = getLimit(user, limitKey);
  if (max === Infinity) return true;

  const { start } = getPeriodBounds();
  const record = await UsageRecord.findOne({ user: user._id, feature, periodStart: start });
  const currentCount = record?.count || 0;

  if (currentCount >= max) {
    const err = new Error(`Daily limit reached for ${feature} on your ${plan} plan. Upgrade for more.`);
    err.code = "USAGE_LIMIT_EXCEEDED";
    throw err;
  }
  return true;
}

export async function getUsageSummary(userId) {
  const { start } = getPeriodBounds();
  const records = await UsageRecord.find({ user: userId, periodStart: start });
  return Object.fromEntries(records.map((r) => [r.feature, r.count]));
}
