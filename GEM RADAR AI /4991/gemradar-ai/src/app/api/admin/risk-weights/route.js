import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { getActiveRiskWeights } from "@/services/risk/riskScannerService";
import { DEFAULT_RISK_WEIGHTS } from "@/services/scanner/scoringEngine";
import SystemSetting from "@/models/SystemSetting";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

const KEYS = Object.keys(DEFAULT_RISK_WEIGHTS);

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const weights = await getActiveRiskWeights();
    return NextResponse.json(successResponse({ weights, defaults: DEFAULT_RISK_WEIGHTS }));
  } catch (err) {
    logger.error(`Admin get risk weights error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load risk weights"), { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const body = await req.json();

    for (const key of KEYS) {
      if (typeof body[key] !== "number" || body[key] < 0 || body[key] > 100) {
        return NextResponse.json(errorResponse(`"${key}" must be a number between 0 and 100`), { status: 400 });
      }
    }

    const weights = Object.fromEntries(KEYS.map((k) => [k, body[k]]));
    await SystemSetting.findOneAndUpdate(
      { key: "risk_weights" },
      { key: "risk_weights", value: weights, description: "Risk Scanner deterministic penalty weights", updatedBy: auth.session.user.id },
      { upsert: true }
    );

    await logAdminAction(auth.session.user.id, "risk.weights_update", { targetType: "SystemSetting", targetId: "risk_weights", details: weights });

    return NextResponse.json(successResponse({ weights }));
  } catch (err) {
    logger.error(`Admin update risk weights error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
