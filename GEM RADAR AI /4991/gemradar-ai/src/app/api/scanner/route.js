import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { scanTokens } from "@/services/scanner/scannerService";
import { reserveUsage } from "@/services/subscription/usageService";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    }

    const rl = checkRateLimit(`scanner:${session.user.id}`);
    if (!rl.allowed) {
      return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json(errorResponse("User not found"), { status: 404 });

    const reservation = await reserveUsage(user, "scan", "scansPerDay");

    const { searchParams } = new URL(req.url);
    const filters = {
      blockchain: searchParams.get("blockchain") || undefined,
      minLiquidity: searchParams.get("minLiquidity") ? Number(searchParams.get("minLiquidity")) : undefined,
      minVolume: searchParams.get("minVolume") ? Number(searchParams.get("minVolume")) : undefined,
      maxMarketCap: searchParams.get("maxMarketCap") ? Number(searchParams.get("maxMarketCap")) : undefined,
      limit: 50
    };

    let results;
    try {
      results = await scanTokens(filters);
    } catch (err) {
      await reservation.release(); // scan failed — don't charge the user's daily quota for it
      throw err;
    }
    await reservation.commit();

    return NextResponse.json(successResponse({ results, count: results.length }));
  } catch (err) {
    logger.error(`Scanner API error: ${err.message}`);
    const status = err.code === "USAGE_LIMIT_EXCEEDED" ? 403 : 500;
    return NextResponse.json(errorResponse(err.message), { status });
  }
}
