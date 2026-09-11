import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import AdminLog from "@/models/AdminLog";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const adminId = searchParams.get("adminId");
    const since = searchParams.get("since");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 25);

    const query = {};
    if (action) query.action = new RegExp(action, "i");
    if (adminId) query.admin = adminId;
    if (since) query.createdAt = { $gte: new Date(since) };

    const skip = (page - 1) * pageSize;
    const [logs, total] = await Promise.all([
      AdminLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("admin", "email username"),
      AdminLog.countDocuments(query)
    ]);

    return NextResponse.json(successResponse({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }));
  } catch (err) {
    logger.error(`Admin logs error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load admin logs"), { status: 500 });
  }
}
