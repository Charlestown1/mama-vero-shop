import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { recordClickAndGetUrl } from "@/services/ads/adServingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

// Records the click BEFORE handing back the destination URL, so the frontend
// can navigate only after the click is durably tracked — and so we can reject
// (never redirect to) an unsafe destination scheme.
export async function POST(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const url = await recordClickAndGetUrl(params.id, session?.user?.id || null);
    return NextResponse.json(successResponse({ url }));
  } catch (err) {
    logger.error(`Ad click error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
