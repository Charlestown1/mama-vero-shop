import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { getEffectivePlan, getPlanLimits, PLAN_PRICING } from "@/services/subscription/subscriptionService";
import { getUsageSummary } from "@/services/subscription/usageService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

// Never returns raw Stripe IDs (customer/subscription IDs) — only what the
// billing UI actually needs to display.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id);
    const subscriptionDoc = await Subscription.findOne({ user: user._id });
    const effectivePlan = getEffectivePlan(user);
    const usage = await getUsageSummary(user._id);

    return NextResponse.json(successResponse({
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      effectivePlan,
      planLabel: PLAN_PRICING[effectivePlan].label,
      limits: getPlanLimits(effectivePlan),
      usageToday: usage,
      hasBillingAccount: Boolean(user.stripeCustomerId),
      currentPeriodEnd: subscriptionDoc?.currentPeriodEnd || null,
      cancelAtPeriodEnd: subscriptionDoc?.cancelAtPeriodEnd || false
    }));
  } catch (err) {
    logger.error(`Get subscription error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load subscription"), { status: 500 });
  }
}
