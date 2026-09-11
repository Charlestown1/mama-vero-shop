import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import { getWalletActivity } from "@/services/smartMoney/walletService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const result = await getWalletActivity(session.user.id, params.id);
    return NextResponse.json(successResponse(result));
  } catch (err) {
    logger.error(`Wallet activity error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
