export const telegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  apiBase: process.env.TELEGRAM_API_BASE || "https://api.telegram.org"
};

export function isTelegramConfigured() {
  return Boolean(telegramConfig.botToken);
}
