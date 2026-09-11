import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { updateTokenFlags } from "@/services/admin/tokenAdminService";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function PATCH(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const body = await req.json();
    const token = await updateTokenFlags(params.id, body);

    const action = body.isBlacklisted !== undefined ? "token.blacklist_change"
      : body.isFeatured !== undefined ? "token.feature_change"
      : body.isSuspicious !== undefined ? "token.suspicious_flag"
      : "token.notes_update";

    await logAdminAction(auth.session.user.id, action, { targetType: "Token", targetId: params.id, details: body });

    return NextResponse.json(successResponse({ token }));
  } catch (err) {
    logger.error(`Admin update token error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
