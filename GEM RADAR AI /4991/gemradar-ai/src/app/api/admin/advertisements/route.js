import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { createAdvertisement, listAdvertisementsWithAnalytics } from "@/services/admin/advertisementAdminService";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    const advertisements = await listAdvertisementsWithAnalytics(range);
    return NextResponse.json(successResponse({ advertisements, range }));
  } catch (err) {
    logger.error(`Admin list ads error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load advertisements"), { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const body = await req.json();
    const ad = await createAdvertisement(body);
    await logAdminAction(auth.session.user.id, "advertisement.create", { targetType: "Advertisement", targetId: ad._id.toString(), details: { title: ad.title, placement: ad.placement } });
    return NextResponse.json(successResponse({ advertisement: ad }));
  } catch (err) {
    logger.error(`Admin create ad error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
