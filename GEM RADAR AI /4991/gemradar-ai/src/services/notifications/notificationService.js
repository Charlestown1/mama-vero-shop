import { sendEmail } from "./emailService";
import { sendTelegramMessage } from "./telegramService";
import logger from "@/lib/logger/logger";

// Single fan-out point for every alert/notification in the app. Routes and the
// alert engine call this instead of talking to email/Telegram directly, so
// delivery logic (and future channels) only need to change in one place.
export async function dispatchNotification(user, { subject, message, channels = [] }) {
  const results = {};

  for (const channel of channels) {
    try {
      if (channel === "email") {
        if (!user.notificationPreferences?.email) { results.email = "skipped (disabled by user)"; continue; }
        await sendEmail(user.email, subject, `<p>${message}</p>`);
        results.email = "sent";
      } else if (channel === "telegram") {
        if (!user.telegramChatId) { results.telegram = "skipped (not connected)"; continue; }
        if (!user.notificationPreferences?.telegram) { results.telegram = "skipped (disabled by user)"; continue; }
        await sendTelegramMessage(user.telegramChatId, `*${subject}*\n${message}`);
        results.telegram = "sent";
      } else if (channel === "in_app") {
        // In-app delivery is read directly off the Alert document (lastTriggeredAt /
        // triggerCount) by the /alerts page — no separate write needed here.
        results.in_app = "recorded";
      }
    } catch (err) {
      logger.warn(`Notification delivery failed on ${channel} for user ${user._id}: ${err.message}`);
      results[channel] = `failed: ${err.message}`;
    }
  }

  return results;
}
