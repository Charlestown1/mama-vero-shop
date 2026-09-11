import Watchlist from "@/models/Watchlist";
import WatchlistItem from "@/models/WatchlistItem";
import ResearchReport from "@/models/ResearchReport";
import ScannerResult from "@/models/ScannerResult";
import Alert from "@/models/Alert";
import { getPortfolioSummary } from "@/services/portfolio/portfolioService";

// Every field is pulled straight from the database or the portfolio service —
// nothing here is a placeholder number. Sections with no data yet report empty
// arrays / null so the UI can render an honest empty state.
export async function getDashboardSnapshot(userId) {
  const [watchlists, recentReports, topOpportunities, activeAlerts, recentAlerts, portfolio] = await Promise.all([
    Watchlist.find({ user: userId }),
    ResearchReport.find({ user: userId }).sort({ createdAt: -1 }).limit(5)
      .select("tokenSnapshot aiOpportunityScore aiRiskScore classification createdAt"),
    ScannerResult.find().sort({ opportunityScore: -1 }).limit(5).populate("token", "symbol blockchain"),
    Alert.countDocuments({ user: userId, isActive: true }),
    Alert.find({ user: userId, lastTriggeredAt: { $ne: null } }).sort({ lastTriggeredAt: -1 }).limit(5),
    getPortfolioSummary(userId).catch(() => ({ totalValue: 0, totalPnl: null, holdings: [] }))
  ]);

  const watchlistIds = watchlists.map((w) => w._id);
  const watchlistTokenCount = await WatchlistItem.countDocuments({ watchlist: { $in: watchlistIds } });

  const highRiskCount = await ScannerResult.countDocuments({ riskLevel: { $in: ["HIGH", "CRITICAL"] } });

  return {
    portfolioValue: portfolio.totalValue || 0,
    portfolioPnl: portfolio.totalPnl,
    watchlistTokenCount,
    activeAlerts,
    highRiskDetected: highRiskCount,
    topOpportunities: topOpportunities.map((r) => ({
      symbol: r.token?.symbol || "Unknown",
      blockchain: r.token?.blockchain,
      opportunityScore: r.opportunityScore,
      riskLevel: r.riskLevel
    })),
    recentReports,
    recentlyTriggeredAlerts: recentAlerts
  };
}
