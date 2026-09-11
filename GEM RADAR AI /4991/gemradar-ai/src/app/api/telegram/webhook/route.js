import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { sendTelegramMessage } from "@/services/notifications/telegramService";
import logger from "@/lib/logger/logger";

// Telegram posts updates here once you call setWebhook (see README). Protected
// by a secret query param since Telegram itself doesn't sign requests:
// set the webhook URL to  .../api/telegram/webhook?secret=<TELEGRAM_WEBHOOK_SECRET>
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    if (!process.env.TELEGRAM_WEBHOOK_SECRET || searchParams.get("secret") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const update = await req.json();
    const message = update?.message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;

    if (text.startsWith("/link ") && chatId) {
      const code = text.replace("/link ", "").trim().toUpperCase();
      await connectDB();
      const user = await User.findOne({ telegramLinkCode: code });

      if (user) {
        user.telegramChatId = String(chatId);
        user.telegramLinkCode = undefined;
        user.notificationPreferences = { ...(user.notificationPreferences || {}), telegram: true };
        await user.save();
        await sendTelegramMessage(chatId, "✅ Your GemRadar AI account is now connected.");
      } else {
        await sendTelegramMessage(chatId, "That code wasn't recognized. Generate a new one from Settings and try again.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error(`Telegram webhook error: ${err.message}`);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
