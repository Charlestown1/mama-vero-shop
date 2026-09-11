import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { assessTokenRisk } from "@/services/risk/riskScannerService";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    const rl = checkRateLimit(`risk:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });

    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const blockchain = searchParams.get("blockchain");

    const assessment = await assessTokenRisk(address, blockchain);
    return NextResponse.json(successResponse({ assessment }));
  } catch (err) {
    logger.error(`Risk scanner error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
