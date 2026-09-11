import { calculateOpportunityScore, calculateRiskScore, DEFAULT_WEIGHTS } from "./scoringEngine";
import SystemSetting from "@/models/SystemSetting";
import ScannerResult from "@/models/ScannerResult";
import Token from "@/models/Token";
import TokenMetrics from "@/models/TokenMetrics";
import { getMarketDataProvider } from "@/services/cryptoData/provider";
import logger from "@/lib/logger/logger";

export async function getActiveWeights() {
  const setting = await SystemSetting.findOne({ key: "scanner_weights" });
  return setting?.value || DEFAULT_WEIGHTS;
}

// Pulls tokens the platform is already tracking (added via research or admin) and
// re-scores them against live metrics. Full open-ended discovery across all chains
// needs a dedicated token-discovery data source (e.g. Dexscreener's trending/boosted
// endpoints or a paid scanner API) — wire that provider here when you have one.
export async function scanTokens(filters = {}) {
  logger.info(`Scanner invoked with filters: ${JSON.stringify(filters)}`);
  const weights = await getActiveWeights();

  const query = { isBlacklisted: { $ne: true } };
  if (filters.blockchain) query.blockchain = filters.blockchain;

  const tokens = await Token.find(query).limit(filters.limit || 50);

  const results = [];
  for (const token of tokens) {
    const metrics = await TokenMetrics.findOne({ token: token._id }).sort({ fetchedAt: -1 });
    if (!metrics) continue;

    if (filters.minLiquidity && (metrics.liquidity || 0) < filters.minLiquidity) continue;
    if (filters.minVolume && (metrics.volume24h || 0) < filters.minVolume) continue;
    if (filters.maxMarketCap && (metrics.marketCap || 0) > filters.maxMarketCap) continue;

    const { score, breakdown } = calculateOpportunityScore(metrics.toObject(), weights);
    const { score: riskScore, level: riskLevel } = calculateRiskScore({});

    const result = await ScannerResult.create({
      token: token._id,
      opportunityScore: score,
      breakdown,
      riskScore,
      riskLevel
    });

    results.push({
      id: result._id,
      symbol: token.symbol,
      name: token.name,
      blockchain: token.blockchain,
      address: token.address,
      opportunityScore: score,
      breakdown,
      riskScore,
      riskLevel,
      metrics: {
        price: metrics.price,
        marketCap: metrics.marketCap,
        liquidity: metrics.liquidity,
        volume24h: metrics.volume24h,
        volumeChangePct: metrics.volumeChangePct,
        holderGrowthPct: metrics.holderGrowthPct,
        whaleActivityLevel: metrics.whaleActivityLevel
      }
    });
  }

  return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

export async function refreshTrackedTokenMetrics() {
  const provider = getMarketDataProvider();
  const tokens = await Token.find({ isBlacklisted: { $ne: true } });
  for (const token of tokens) {
    try {
      const priceData = await provider.getTokenPrice(token.coingeckoId || token.symbol.toLowerCase());
      if (!priceData) continue;
      await TokenMetrics.create({
        token: token._id,
        price: priceData.usd,
        priceChange24h: priceData.usd_24h_change,
        fetchedAt: new Date()
      });
    } catch (err) {
      logger.warn(`Failed to refresh metrics for ${token.symbol}: ${err.message}`);
    }
  }
}
