import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { getMarketAiSummary } from "@/services/market/marketService";
import { assertFeatureAccess, UpgradeRequiredError } from "@/services/subscription/subscriptionService";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    const rl = checkRateLimit(`market-summary:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });

    await connectDB();
    const user = await User.findById(session.user.id);
    assertFeatureAccess(user, "marketAiSummary", "AI Market Summary");

    const { raw, parsed } = await getMarketAiSummary();
    if (!parsed) return NextResponse.json(errorResponse("AI response could not be parsed. Please try again."), { status: 502 });

    return NextResponse.json(successResponse({ summary: parsed, raw }));
  } catch (err) {
    logger.error(`Market AI summary error: ${err.message}`);
    const status = err instanceof UpgradeRequiredError ? 403 : err.message.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json(errorResponse(err.message, err.requiredPlan ? { requiredPlan: err.requiredPlan } : undefined), { status });
  }
}
