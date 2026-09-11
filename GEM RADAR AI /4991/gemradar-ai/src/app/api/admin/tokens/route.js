import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { listTokens } from "@/services/admin/tokenAdminService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const result = await listTokens({
      search: searchParams.get("search") || undefined,
      blockchain: searchParams.get("blockchain") || undefined,
      flag: searchParams.get("flag") || undefined,
      page: Number(searchParams.get("page") || 1),
      pageSize: Number(searchParams.get("pageSize") || 20)
    });
    return NextResponse.json(successResponse(result));
  } catch (err) {
    logger.error(`Admin list tokens error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load tokens"), { status: 500 });
  }
}
