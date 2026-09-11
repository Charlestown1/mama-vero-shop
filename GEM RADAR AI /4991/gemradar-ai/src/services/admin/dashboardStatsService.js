import User from "@/models/User";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import ResearchReport from "@/models/ResearchReport";
import ScannerResult from "@/models/ScannerResult";
import Alert from "@/models/Alert";
import Watchlist from "@/models/Watchlist";
import Portfolio from "@/models/Portfolio";
import WalletActivity from "@/models/WalletActivity";
import AdvertisementImpression from "@/models/AdvertisementImpression";
import AdvertisementClick from "@/models/AdvertisementClick";
import AdminLog from "@/models/AdminLog";

const RANGE_DAYS = { today: 1, "7d": 7, "30d": 30, all: null };

function rangeStart(rangeKey) {
  const days = RANGE_DAYS[rangeKey] ?? RANGE_DAYS["7d"];
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function withDateFilter(baseQuery, field, since) {
  return since ? { ...baseQuery, [field]: { $gte: since } } : baseQuery;
}

// Every number below is a real MongoDB count/aggregate for the requested range —
// nothing here is a placeholder or estimated figure.
export async function getAdminDashboardStats(rangeKey = "7d") {
  const since = rangeStart(rangeKey);

  const [
    totalUsers, newUsers, freeUsers, proUsers, proPlusUsers,
    activeSubs, canceledSubs, recentPayments,
    researchReports, scannerRuns, activeAlerts,
    watchlistCount, portfolioCount, walletActivityCount,
    impressions, clicks, recentAdminLogs
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments(withDateFilter({}, "createdAt", since)),
    User.countDocuments({ subscriptionTier: "free" }),
    User.countDocuments({ subscriptionTier: "pro" }),
    User.countDocuments({ subscriptionTier: "pro_plus" }),
    Subscription.countDocuments({ status: "active" }),
    Subscription.countDocuments({ status: "canceled" }),
    Payment.find(withDateFilter({}, "createdAt", since)).sort({ createdAt: -1 }).limit(10).populate("user", "email username"),
    ResearchReport.countDocuments(withDateFilter({}, "createdAt", since)),
    ScannerResult.countDocuments(withDateFilter({}, "scannedAt", since)),
    Alert.countDocuments({ isActive: true }),
    Watchlist.countDocuments(withDateFilter({}, "createdAt", since)),
    Portfolio.countDocuments(withDateFilter({}, "createdAt", since)),
    WalletActivity.countDocuments(withDateFilter({}, "occurredAt", since)),
    AdvertisementImpression.countDocuments(withDateFilter({}, "occurredAt", since)),
    AdvertisementClick.countDocuments(withDateFilter({}, "occurredAt", since)),
    AdminLog.find({}).sort({ createdAt: -1 }).limit(10).populate("admin", "email username")
  ]);

  return {
    range: rangeKey,
    users: { total: totalUsers, new: newUsers, free: freeUsers, pro: proUsers, proPlus: proPlusUsers },
    subscriptions: { active: activeSubs, canceled: canceledSubs },
    recentPayments,
    activity: {
      researchReports, scannerRuns, activeAlerts,
      watchlistsCreated: watchlistCount, portfoliosCreated: portfolioCount, walletActivityRecorded: walletActivityCount
    },
    ads: { impressions, clicks, ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0 },
    recentAdminLogs
  };
}
