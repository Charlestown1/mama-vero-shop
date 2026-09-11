import axios from "axios";
import { telegramConfig, isTelegramConfigured } from "@/config/telegram";

export async function sendTelegramMessage(chatId, message) {
  if (!isTelegramConfigured()) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set. Add it to .env to enable Telegram alerts.");
  }
  const url = `${telegramConfig.apiBase}/bot${telegramConfig.botToken}/sendMessage`;
  await axios.post(url, { chat_id: chatId, text: message, parse_mode: "Markdown" });
}

export async function sendTestMessage(chatId) {
  return sendTelegramMessage(chatId, "✅ GemRadar AI is connected. You'll receive alert notifications here.");
}

// Telegram doesn't let a bot know a user's chat ID until that user messages the
// bot first. This reads the bot's pending updates so the webhook route can map
// an incoming "/link <code>" message to the right GemRadar account.
export async function getUpdates(offset) {
  if (!isTelegramConfigured()) return [];
  const url = `${telegramConfig.apiBase}/bot${telegramConfig.botToken}/getUpdates`;
  const { data } = await axios.get(url, { params: { offset, timeout: 0 } });
  return data?.result || [];
}
