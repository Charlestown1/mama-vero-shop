import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { updateHolding, removeHolding } from "@/services/portfolio/portfolioService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const body = await req.json();
    const holding = await updateHolding(session.user.id, params.id, body);
    return NextResponse.json(successResponse({ holding }));
  } catch (err) {
    logger.error(`Update holding error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    await removeHolding(session.user.id, params.id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Remove holding error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
