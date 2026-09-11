import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { removeTokenFromWatchlist } from "@/services/watchlist/watchlistService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    await removeTokenFromWatchlist(session.user.id, params.id, params.itemId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Remove watchlist item error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
