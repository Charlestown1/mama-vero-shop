import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { getDashboardSnapshot } from "@/services/dashboard/dashboardService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const snapshot = await getDashboardSnapshot(session.user.id);
    return NextResponse.json(successResponse(snapshot));
  } catch (err) {
    logger.error(`Dashboard snapshot error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load dashboard"), { status: 500 });
  }
}
