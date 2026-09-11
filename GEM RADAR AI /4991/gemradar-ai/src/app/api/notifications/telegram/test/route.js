import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { sendTestMessage } from "@/services/notifications/telegramService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user.telegramChatId) {
      return NextResponse.json(errorResponse("Telegram is not connected yet. Generate a link code first."), { status: 400 });
    }

    await sendTestMessage(user.telegramChatId);
    return NextResponse.json(successResponse({ sent: true }));
  } catch (err) {
    logger.error(`Telegram test error: ${err.message}`);
    const status = err.message.includes("TELEGRAM_BOT_TOKEN") ? 503 : 500;
    return NextResponse.json(errorResponse(err.message), { status });
  }
}
