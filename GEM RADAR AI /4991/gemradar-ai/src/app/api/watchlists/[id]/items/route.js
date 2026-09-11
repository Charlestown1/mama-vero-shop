import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { addTokenToWatchlist, reorderWatchlistItems } from "@/services/watchlist/watchlistService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const body = await req.json();
    const item = await addTokenToWatchlist(session.user.id, params.id, body);
    return NextResponse.json(successResponse({ item }));
  } catch (err) {
    logger.error(`Add watchlist item error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const { orderedItemIds } = await req.json();
    const items = await reorderWatchlistItems(session.user.id, params.id, orderedItemIds);
    return NextResponse.json(successResponse({ items }));
  } catch (err) {
    logger.error(`Reorder watchlist error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
