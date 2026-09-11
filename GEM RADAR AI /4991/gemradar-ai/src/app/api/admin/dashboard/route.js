import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { getAdminDashboardStats } from "@/services/admin/dashboardStatsService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";
    const stats = await getAdminDashboardStats(range);
    return NextResponse.json(successResponse(stats));
  } catch (err) {
    logger.error(`Admin dashboard error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load admin dashboard"), { status: 500 });
  }
}
