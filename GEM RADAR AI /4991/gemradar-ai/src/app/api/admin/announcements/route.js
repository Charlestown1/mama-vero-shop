import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { createAnnouncement, listAllAnnouncements } from "@/services/admin/announcementAdminService";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const announcements = await listAllAnnouncements();
    return NextResponse.json(successResponse({ announcements }));
  } catch (err) {
    logger.error(`Admin list announcements error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load announcements"), { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const body = await req.json();
    const announcement = await createAnnouncement(auth.session.user.id, body);
    await logAdminAction(auth.session.user.id, "announcement.create", { targetType: "Announcement", targetId: announcement._id.toString(), details: { title: announcement.title, placement: announcement.placement } });
    return NextResponse.json(successResponse({ announcement }));
  } catch (err) {
    logger.error(`Admin create announcement error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
