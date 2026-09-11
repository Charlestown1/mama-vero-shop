import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import Alert from "@/models/Alert";
import { createAlert, listAlerts } from "@/services/alerts/alertService";
import { getLimit, canAccessFeature, PLAN_PRICING } from "@/services/subscription/subscriptionService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    await connectDB();
    const alerts = await listAlerts(session.user.id);
    return NextResponse.json(successResponse({ alerts }));
  } catch (err) {
    logger.error(`List alerts error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load alerts"), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    const rl = checkRateLimit(`alert-create:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });
    await connectDB();

    const user = await User.findById(session.user.id);
    const alertLimit = getLimit(user, "alerts");
    const currentAlertCount = await Alert.countDocuments({ user: session.user.id });
    if (currentAlertCount >= alertLimit) {
      return NextResponse.json(errorResponse(`Your plan allows up to ${alertLimit} alerts. Upgrade for more.`), { status: 403 });
    }

    const body = await req.json();
    if (body.channels?.includes("telegram")) {
      if (!canAccessFeature(user, "telegramAlerts")) {
        return NextResponse.json(errorResponse(`Telegram alerts require the ${PLAN_PRICING.pro.label} plan or higher.`), { status: 403 });
      }
      if (!user.telegramChatId) {
        return NextResponse.json(errorResponse("Connect Telegram in Settings before enabling Telegram alerts"), { status: 400 });
      }
    }

    const alert = await createAlert(session.user.id, body);
    return NextResponse.json(successResponse({ alert }));
  } catch (err) {
    logger.error(`Create alert error: ${err.message}`);
    const status = err.message.includes("Daily limit") ? 403 : 400;
    return NextResponse.json(errorResponse(err.message), { status });
  }
}
