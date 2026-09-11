import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { PLAN_PRICING, PLAN_LIMITS, PLAN_FEATURE_COPY, getEffectivePlan } from "@/services/subscription/subscriptionService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

// Public — the pricing page reads plan definitions from here rather than
// hardcoding prices/limits in the frontend, so they only ever need to change
// in subscriptionService.js.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let currentPlan = null;

    if (session) {
      await connectDB();
      const user = await User.findById(session.user.id);
      if (user) currentPlan = getEffectivePlan(user);
    }

    const plans = Object.keys(PLAN_PRICING).map((key) => ({
      key,
      ...PLAN_PRICING[key],
      limits: PLAN_LIMITS[key],
      features: PLAN_FEATURE_COPY[key]
    }));

    return NextResponse.json(successResponse({ plans, currentPlan }));
  } catch (err) {
    logger.error(`Get plans error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load plans"), { status: 500 });
  }
}
