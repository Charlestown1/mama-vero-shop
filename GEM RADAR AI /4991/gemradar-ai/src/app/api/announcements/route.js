import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { getEffectivePlan } from "@/services/subscription/subscriptionService";
import { getActiveAnnouncements } from "@/services/admin/announcementAdminService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get("placement");
    if (!placement) return NextResponse.json(errorResponse("placement is required"), { status: 400 });

    await connectDB();
    const session = await getServerSession(authOptions);
    let userPlan = "all";
    if (session) {
      const user = await User.findById(session.user.id);
      userPlan = user ? getEffectivePlan(user) : "all";
    }

    const announcements = await getActiveAnnouncements(placement, userPlan);
    return NextResponse.json(successResponse({ announcements }));
  } catch (err) {
    logger.error(`Announcement serving error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load announcements"), { status: 500 });
  }
}
