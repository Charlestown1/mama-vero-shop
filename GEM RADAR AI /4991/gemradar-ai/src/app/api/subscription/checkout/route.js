import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { createCheckoutSession } from "@/services/stripe/stripeService";
import { isStripeConfigured } from "@/config/stripe";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    const rl = checkRateLimit(`checkout:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });

    if (!isStripeConfigured()) {
      return NextResponse.json(errorResponse("Payments are not configured yet. Set STRIPE_SECRET_KEY in .env."), { status: 503 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json(errorResponse("User not found"), { status: 404 });

    // Plan comes from a fixed whitelist inside createCheckoutSession — the
    // request body only ever selects which of the two known plans, never a
    // price ID or amount, so the client cannot grant itself a discount.
    const { plan } = await req.json();
    const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;

    const checkoutSession = await createCheckoutSession(user, plan, baseUrl);
    return NextResponse.json(successResponse({ url: checkoutSession.url }));
  } catch (err) {
    logger.error(`Checkout session error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
