import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import ResearchReport from "@/models/ResearchReport";
import { runResearch } from "@/services/research/researchService";
import { reserveUsage } from "@/services/subscription/usageService";
import { getLimit } from "@/services/subscription/subscriptionService";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id);
    const historyDays = getLimit(user, "researchHistoryDays");

    const query = { user: session.user.id };
    if (historyDays !== Infinity) {
      query.createdAt = { $gte: new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000) };
    }

    const reports = await ResearchReport.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("tokenSnapshot aiOpportunityScore aiRiskScore classification createdAt");

    return NextResponse.json(successResponse({
      reports,
      historyLimitDays: historyDays === Infinity ? null : historyDays
    }));
  } catch (err) {
    logger.error(`Research history error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load research history"), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    const rl = checkRateLimit(`research:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json(errorResponse("User not found"), { status: 404 });

    const body = await req.json();
    const { symbol, address, blockchain } = body;
    if (!symbol && !address) {
      return NextResponse.json(errorResponse("Provide at least a token symbol or contract address"), { status: 400 });
    }

    const reservation = await reserveUsage(user, "ai_research", "aiResearchPerDay");

    let report;
    try {
      const result = await runResearch({ symbol, address, blockchain });
      report = await ResearchReport.create({ user: user._id, ...result });
    } catch (err) {
      await reservation.release(); // generation failed — don't charge the user's daily quota for it
      throw err;
    }
    await reservation.commit();

    return NextResponse.json(successResponse({ report }));
  } catch (err) {
    logger.error(`Research generation error: ${err.message}`);
    const status = err.code === "INVALID_AI_RESPONSE" ? 502
      : err.code === "USAGE_LIMIT_EXCEEDED" ? 403
      : err.message.includes("GEMINI_API_KEY") ? 503
      : 500;
    return NextResponse.json(errorResponse(err.message), { status });
  }
}
