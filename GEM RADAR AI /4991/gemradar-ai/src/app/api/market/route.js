import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { getMarketSnapshot } from "@/services/market/marketService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    const snapshot = await getMarketSnapshot();
    return NextResponse.json(successResponse(snapshot));
  } catch (err) {
    logger.error(`Market snapshot error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load market data"), { status: 500 });
  }
}
