import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { getEffectivePlan } from "@/services/subscription/subscriptionService";
import { getAdForPlacement, recordImpression } from "@/services/ads/adServingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

// Public — ads render for logged-out visitors too (homepage placement).
// Impressions are deduplicated server-side (see adServingService), so a
// component re-rendering doesn't inflate the count; the frontend should still
// only call this once per mount, not on every render.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get("placement");
    if (!placement) return NextResponse.json(errorResponse("placement is required"), { status: 400 });

    await connectDB();
    const session = await getServerSession(authOptions);
    let userPlan = "all";
    let userId = null;
    if (session) {
      const user = await User.findById(session.user.id);
      userPlan = user ? getEffectivePlan(user) : "all";
      userId = session.user.id;
    }

    const ad = await getAdForPlacement(placement, userPlan);
    if (!ad) return NextResponse.json(successResponse({ ad: null }));

    await recordImpression(ad._id, userId);

    return NextResponse.json(successResponse({
      ad: {
        id: ad._id,
        title: ad.title,
        advertiserName: ad.advertiserName,
        imageUrl: ad.imageUrl,
        description: ad.description,
        ctaText: ad.ctaText
      }
    }));
  } catch (err) {
    logger.error(`Ad serving error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load advertisement"), { status: 500 });
  }
}
