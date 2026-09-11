import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import SystemSetting from "@/models/SystemSetting";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

// Internal bookkeeping keys (Stripe webhook idempotency markers) are excluded —
// this endpoint is for genuine platform configuration only, and this list is
// also the enforcement point that keeps env secrets from ever landing here:
// nothing reads process.env in this route, only what admins themselves saved
// to SystemSetting through this same route or the dedicated weights routes.
const HIDDEN_KEY_PREFIXES = ["stripe_event_"];

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const settings = await SystemSetting.find({}).sort({ key: 1 });
    const visible = settings.filter((s) => !HIDDEN_KEY_PREFIXES.some((p) => s.key.startsWith(p)));
    return NextResponse.json(successResponse({ settings: visible }));
  } catch (err) {
    logger.error(`Admin get settings error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load settings"), { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const { key, value, description } = await req.json();
    if (!key || HIDDEN_KEY_PREFIXES.some((p) => key.startsWith(p))) {
      return NextResponse.json(errorResponse("Invalid setting key"), { status: 400 });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { key, value, description, updatedBy: auth.session.user.id },
      { upsert: true, new: true }
    );

    await logAdminAction(auth.session.user.id, "system_setting.update", { targetType: "SystemSetting", targetId: key, details: { value } });

    return NextResponse.json(successResponse({ setting }));
  } catch (err) {
    logger.error(`Admin update setting error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
