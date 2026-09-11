import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await User.findByIdAndUpdate(session.user.id, { telegramLinkCode: code });

    return NextResponse.json(successResponse({
      code,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
      instructions: `Open your Telegram bot and send: /link ${code}`
    }));
  } catch (err) {
    logger.error(`Generate telegram code error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to generate link code"), { status: 500 });
  }
}
