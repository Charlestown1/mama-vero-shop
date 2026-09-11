import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { renameWatchlist, deleteWatchlist } from "@/services/watchlist/watchlistService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const { name } = await req.json();
    const watchlist = await renameWatchlist(session.user.id, params.id, name);
    return NextResponse.json(successResponse({ watchlist }));
  } catch (err) {
    logger.error(`Rename watchlist error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    await deleteWatchlist(session.user.id, params.id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Delete watchlist error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
