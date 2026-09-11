import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { updateAdvertisement, deleteAdvertisement } from "@/services/admin/advertisementAdminService";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function PATCH(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const body = await req.json();
    const ad = await updateAdvertisement(params.id, body);

    const action = body.status ? "advertisement.status_change" : "advertisement.update";
    await logAdminAction(auth.session.user.id, action, { targetType: "Advertisement", targetId: params.id, details: body });

    return NextResponse.json(successResponse({ advertisement: ad }));
  } catch (err) {
    logger.error(`Admin update ad error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    await deleteAdvertisement(params.id);
    await logAdminAction(auth.session.user.id, "advertisement.delete", { targetType: "Advertisement", targetId: params.id });
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Admin delete ad error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
