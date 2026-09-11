import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { toggleWallet, removeWallet } from "@/services/smartMoney/walletService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const { isTracked } = await req.json();
    const wallet = await toggleWallet(session.user.id, params.id, isTracked);
    return NextResponse.json(successResponse({ wallet }));
  } catch (err) {
    logger.error(`Toggle wallet error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    await removeWallet(session.user.id, params.id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Remove wallet error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
