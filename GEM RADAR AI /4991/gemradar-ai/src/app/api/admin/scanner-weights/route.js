import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { getActiveWeights } from "@/services/scanner/scannerService";
import { DEFAULT_WEIGHTS } from "@/services/scanner/scoringEngine";
import SystemSetting from "@/models/SystemSetting";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

const KEYS = Object.keys(DEFAULT_WEIGHTS);

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const weights = await getActiveWeights();
    return NextResponse.json(successResponse({ weights, defaults: DEFAULT_WEIGHTS }));
  } catch (err) {
    logger.error(`Admin get scanner weights error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load scanner weights"), { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const body = await req.json();

    for (const key of KEYS) {
      if (typeof body[key] !== "number" || body[key] < 0) {
        return NextResponse.json(errorResponse(`"${key}" must be a non-negative number`), { status: 400 });
      }
    }
    const total = KEYS.reduce((sum, k) => sum + body[k], 0);
    if (Math.round(total) !== 100) {
      return NextResponse.json(errorResponse(`Weights must sum to 100 (currently ${total}).`), { status: 400 });
    }

    const weights = Object.fromEntries(KEYS.map((k) => [k, body[k]]));
    await SystemSetting.findOneAndUpdate(
      { key: "scanner_weights" },
      { key: "scanner_weights", value: weights, description: "Gem Scanner deterministic scoring weights", updatedBy: auth.session.user.id },
      { upsert: true }
    );

    await logAdminAction(auth.session.user.id, "scanner.weights_update", { targetType: "SystemSetting", targetId: "scanner_weights", details: weights });

    return NextResponse.json(successResponse({ weights }));
  } catch (err) {
    logger.error(`Admin update scanner weights error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
