import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { evaluateAllAlerts } from "@/services/alerts/alertEngine";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

// Not user-facing. Call this on a schedule from an external cron (Vercel Cron,
// GitHub Actions, cron-job.org, etc.) with header `x-cron-secret: <CRON_SECRET>`.
// This process is stateless between invocations, so a real scheduler — not a
// user visiting a page — is what makes alerts actually fire in production.
export async function POST(req) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    await connectDB();
    const summary = await evaluateAllAlerts();
    logger.info(`Alert evaluation run: ${JSON.stringify(summary)}`);
    return NextResponse.json(successResponse(summary));
  } catch (err) {
    logger.error(`Alert evaluation error: ${err.message}`);
    return NextResponse.json(errorResponse("Alert evaluation failed"), { status: 500 });
  }
}
