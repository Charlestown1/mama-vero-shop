import Alert from "@/models/Alert";
import TokenMetrics from "@/models/TokenMetrics";
import ScannerResult from "@/models/ScannerResult";
import WalletActivity from "@/models/WalletActivity";
import User from "@/models/User";
import { getMarketDataProvider } from "@/services/cryptoData/provider";
import { dispatchNotification } from "@/services/notifications/notificationService";
import logger from "@/lib/logger/logger";

function compare(current, operator, target) {
  switch (operator) {
    case "gt": return current > target;
    case "gte": return current >= target;
    case "lt": return current < target;
    case "lte": return current <= target;
    case "eq": return current === target;
    default: return false;
  }
}

async function getCurrentValue(alert) {
  const metric = alert.condition.metric;

  if (metric === "price" && alert.tokenSymbol) {
    try {
      const price = await getMarketDataProvider().getTokenPrice(alert.tokenSymbol.toLowerCase());
      return price?.usd ?? null;
    } catch { return null; }
  }

  if (["priceChange24h", "volume24h", "holderGrowthPct"].includes(metric) && alert.token) {
    const metrics = await TokenMetrics.findOne({ token: alert.token }).sort({ fetchedAt: -1 });
    return metrics?.[metric] ?? null;
  }

  if (metric === "opportunityScore" && alert.token) {
    const result = await ScannerResult.findOne({ token: alert.token }).sort({ scannedAt: -1 });
    return result?.opportunityScore ?? null;
  }

  if (metric === "riskScore" && alert.token) {
    const result = await ScannerResult.findOne({ token: alert.token }).sort({ scannedAt: -1 });
    return result?.riskScore ?? null;
  }

  return null;
}

function isInCooldown(alert) {
  if (!alert.lastTriggeredAt) return false;
  const elapsedMinutes = (Date.now() - new Date(alert.lastTriggeredAt).getTime()) / 60000;
  return elapsedMinutes < (alert.cooldownMinutes || 60);
}

async function triggerAlert(alert, message) {
  const user = await User.findById(alert.user);
  if (!user) return;

  await dispatchNotification(user, {
    subject: `GemRadar Alert: ${alert.tokenSymbol || alert.type}`,
    message,
    channels: alert.channels
  });

  alert.lastTriggeredAt = new Date();
  alert.triggerCount = (alert.triggerCount || 0) + 1;
  await alert.save();

  logger.info(`Alert ${alert._id} triggered for user ${alert.user}`);
}

// Meant to run on a schedule (see /api/alerts/evaluate — wire an external cron to
// call it). Only ever compares real current values against real thresholds;
// missing data is skipped, never treated as a match. Cooldown prevents repeat
// notifications for a condition that stays true across multiple runs.
export async function evaluateAllAlerts() {
  const alerts = await Alert.find({ isActive: true });
  const summary = { checked: 0, triggered: 0, skippedCooldown: 0, skippedNoData: 0 };

  for (const alert of alerts) {
    summary.checked += 1;
    if (isInCooldown(alert)) { summary.skippedCooldown += 1; continue; }

    if (alert.type === "wallet_activity") {
      const recentActivity = await WalletActivity.findOne({ wallet: alert.wallet }).sort({ occurredAt: -1 });
      if (!recentActivity || (alert.lastTriggeredAt && recentActivity.occurredAt <= alert.lastTriggeredAt)) {
        summary.skippedNoData += 1;
        continue;
      }
      await triggerAlert(alert, `New wallet activity: ${recentActivity.type}${recentActivity.amountUsd ? ` — $${recentActivity.amountUsd}` : ""}`);
      summary.triggered += 1;
      continue;
    }

    const currentValue = await getCurrentValue(alert);
    if (currentValue === null || currentValue === undefined) {
      summary.skippedNoData += 1;
      continue;
    }

    if (compare(currentValue, alert.condition.operator, alert.condition.value)) {
      await triggerAlert(alert, `${alert.condition.metric} is now ${currentValue} (condition: ${alert.condition.operator} ${alert.condition.value})`);
      summary.triggered += 1;
    }
  }

  return summary;
}
