import Token from "@/models/Token";
import ScannerResult from "@/models/ScannerResult";

export async function listTokens({ search, blockchain, flag, page = 1, pageSize = 20 }) {
  const query = {};
  if (search) {
    const re = new RegExp(search.trim(), "i");
    query.$or = [{ symbol: re }, { name: re }, { address: re }];
  }
  if (blockchain) query.blockchain = blockchain;
  if (flag === "featured") query.isFeatured = true;
  if (flag === "blacklisted") query.isBlacklisted = true;
  if (flag === "suspicious") query.isSuspicious = true;

  const skip = (page - 1) * pageSize;
  const [tokens, total] = await Promise.all([
    Token.find(query).sort({ updatedAt: -1 }).skip(skip).limit(pageSize),
    Token.countDocuments(query)
  ]);

  const enriched = await Promise.all(
    tokens.map(async (t) => {
      const latest = await ScannerResult.findOne({ token: t._id }).sort({ scannedAt: -1 });
      return {
        ...t.toObject(),
        latestOpportunityScore: latest?.opportunityScore ?? null,
        latestRiskScore: latest?.riskScore ?? null,
        latestRiskLevel: latest?.riskLevel ?? null
      };
    })
  );

  return { tokens: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateTokenFlags(tokenId, updates) {
  const allowed = ["isFeatured", "isBlacklisted", "isSuspicious", "adminNotes"];
  const patch = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  const token = await Token.findByIdAndUpdate(tokenId, patch, { new: true });
  if (!token) throw new Error("Token not found");
  return token;
  // Blacklist enforcement itself lives in scannerService.scanTokens (query excludes
  // isBlacklisted: true) — this is the single place that flag is set, so admin
  // control and scanner behavior can never drift apart.
}
