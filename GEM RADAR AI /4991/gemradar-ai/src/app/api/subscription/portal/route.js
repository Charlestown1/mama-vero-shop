import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { createPortalSession } from "@/services/stripe/stripeService";
import { isStripeConfigured } from "@/config/stripe";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    const rl = checkRateLimit(`billing-portal:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });

    if (!isStripeConfigured()) {
      return NextResponse.json(errorResponse("Payments are not configured yet."), { status: 503 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;

    const portal = await createPortalSession(user, baseUrl);
    return NextResponse.json(successResponse({ url: portal.url }));
  } catch (err) {
    logger.error(`Billing portal error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
