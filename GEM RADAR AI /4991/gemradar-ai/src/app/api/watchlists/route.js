import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import Watchlist from "@/models/Watchlist";
import { createWatchlist, listWatchlists } from "@/services/watchlist/watchlistService";
import { getLimit } from "@/services/subscription/subscriptionService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const watchlists = await listWatchlists(session.user.id);
    return NextResponse.json(successResponse({ watchlists }));
  } catch (err) {
    logger.error(`List watchlists error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load watchlists"), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    const rl = checkRateLimit(`watchlist-create:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });
    await connectDB();

    const user = await User.findById(session.user.id);
    const limit = getLimit(user, "watchlists");
    const currentCount = await Watchlist.countDocuments({ user: session.user.id });
    if (currentCount >= limit) {
      return NextResponse.json(errorResponse(`Your plan allows up to ${limit} watchlist(s). Upgrade for more.`), { status: 403 });
    }

    const { name } = await req.json();
    const watchlist = await createWatchlist(session.user.id, name);
    return NextResponse.json(successResponse({ watchlist }));
  } catch (err) {
    logger.error(`Create watchlist error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
