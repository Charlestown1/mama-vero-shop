import User from "@/models/User";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import ResearchReport from "@/models/ResearchReport";
import Alert from "@/models/Alert";
import Watchlist from "@/models/Watchlist";
import Portfolio from "@/models/Portfolio";
import PortfolioHolding from "@/models/PortfolioHolding";

export async function listUsers({ search, plan, role, status, page = 1, pageSize = 20 }) {
  const query = {};
  if (search) {
    const re = new RegExp(search.trim(), "i");
    query.$or = [{ email: re }, { username: re }, { name: re }];
  }
  if (plan) query.subscriptionTier = plan;
  if (role) query.role = role;
  if (status === "suspended") query.isSuspended = true;
  if (status === "active") query.isSuspended = { $ne: true };

  const skip = (page - 1) * pageSize;
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize)
      .select("-password"), // never select the password hash for admin views
    User.countDocuments(query)
  ]);

  return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// Returns everything the admin detail view needs, deliberately excluding the
// password hash and never fetching anything beyond what administration
// actually requires (e.g. no full portfolio holding history dump).
export async function getUserDetail(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");

  const [subscription, payments, researchCount, alerts, watchlists, portfolio] = await Promise.all([
    Subscription.findOne({ user: userId }),
    Payment.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    ResearchReport.countDocuments({ user: userId }),
    Alert.find({ user: userId }).select("type isActive triggerCount"),
    Watchlist.find({ user: userId }).select("name"),
    Portfolio.findOne({ user: userId })
  ]);

  const portfolioHoldingsCount = portfolio ? await PortfolioHolding.countDocuments({ portfolio: portfolio._id }) : 0;

  return {
    user,
    subscription,
    payments,
    activity: {
      researchReportsCount: researchCount,
      alertsCount: alerts.length,
      activeAlertsCount: alerts.filter((a) => a.isActive).length,
      watchlistsCount: watchlists.length,
      hasPortfolio: Boolean(portfolio),
      portfolioHoldingsCount
    }
  };
}

export async function setUserSuspended(userId, isSuspended) {
  const user = await User.findByIdAndUpdate(userId, { isSuspended }, { new: true }).select("-password");
  if (!user) throw new Error("User not found");
  return user;
}

export async function setUserRole(userId, role) {
  if (!["user", "admin"].includes(role)) throw new Error("Invalid role");
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
  if (!user) throw new Error("User not found");
  return user;
}

// Manual override for support cases (e.g. a comped account). This intentionally
// goes through the same fields Stripe webhooks update, so getEffectivePlan()
// behaves identically regardless of whether the change came from Stripe or an admin.
export async function setUserSubscription(userId, { tier, status }) {
  const updates = {};
  if (tier) updates.subscriptionTier = tier;
  if (status) updates.subscriptionStatus = status;
  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
  if (!user) throw new Error("User not found");
  return user;
}
