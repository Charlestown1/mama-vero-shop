import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { updateAnnouncement, deleteAnnouncement } from "@/services/admin/announcementAdminService";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function PATCH(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const body = await req.json();
    const announcement = await updateAnnouncement(params.id, body);
    await logAdminAction(auth.session.user.id, "announcement.update", { targetType: "Announcement", targetId: params.id, details: body });
    return NextResponse.json(successResponse({ announcement }));
  } catch (err) {
    logger.error(`Admin update announcement error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    await deleteAnnouncement(params.id);
    await logAdminAction(auth.session.user.id, "announcement.delete", { targetType: "Announcement", targetId: params.id });
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Admin delete announcement error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
