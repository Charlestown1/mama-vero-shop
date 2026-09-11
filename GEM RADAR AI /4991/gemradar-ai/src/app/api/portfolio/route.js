import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { addHolding, getPortfolioSummary } from "@/services/portfolio/portfolioService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const summary = await getPortfolioSummary(session.user.id);
    return NextResponse.json(successResponse(summary));
  } catch (err) {
    logger.error(`Portfolio fetch error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load portfolio"), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    const rl = checkRateLimit(`portfolio-add:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });
    await connectDB();
    const body = await req.json();
    const holding = await addHolding(session.user.id, body);
    return NextResponse.json(successResponse({ holding }));
  } catch (err) {
    logger.error(`Add holding error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
