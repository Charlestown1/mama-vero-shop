import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { addWallet, listWallets } from "@/services/smartMoney/walletService";
import { assertFeatureAccess, UpgradeRequiredError } from "@/services/subscription/subscriptionService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import logger from "@/lib/logger/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const wallets = await listWallets(session.user.id);
    return NextResponse.json(successResponse({ wallets }));
  } catch (err) {
    logger.error(`List wallets error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load wallets"), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    const rl = checkRateLimit(`wallet-add:${session.user.id}`);
    if (!rl.allowed) return NextResponse.json(errorResponse("Too many requests. Please slow down."), { status: 429 });

    await connectDB();
    const user = await User.findById(session.user.id);
    assertFeatureAccess(user, "smartMoney", "Smart Money wallet tracking");

    const body = await req.json();
    const wallet = await addWallet(session.user.id, body);
    return NextResponse.json(successResponse({ wallet }));
  } catch (err) {
    logger.error(`Add wallet error: ${err.message}`);
    const status = err instanceof UpgradeRequiredError ? 403 : 400;
    return NextResponse.json(errorResponse(err.message, err.requiredPlan ? { requiredPlan: err.requiredPlan } : undefined), { status });
  }
}
