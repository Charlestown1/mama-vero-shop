import Portfolio from "@/models/Portfolio";
import PortfolioHolding from "@/models/PortfolioHolding";
import { getMarketDataProvider } from "@/services/cryptoData/provider";
import { analyzePortfolio } from "@/services/ai/geminiService";

async function getOrCreatePortfolio(userId) {
  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) portfolio = await Portfolio.create({ user: userId, name: "My Portfolio" });
  return portfolio;
}

async function getLivePrice(symbol) {
  try {
    const price = await getMarketDataProvider().getTokenPrice(symbol.toLowerCase());
    return price?.usd ?? null;
  } catch {
    return null;
  }
}

export async function addHolding(userId, { symbol, quantity, avgBuyPrice }) {
  if (!symbol || !quantity) throw new Error("Symbol and quantity are required");
  const portfolio = await getOrCreatePortfolio(userId);
  return PortfolioHolding.create({
    portfolio: portfolio._id,
    symbol: symbol.toUpperCase(),
    quantity,
    avgBuyPrice: avgBuyPrice ?? null
  });
}

export async function updateHolding(userId, holdingId, updates) {
  const portfolio = await getOrCreatePortfolio(userId);
  const holding = await PortfolioHolding.findOneAndUpdate(
    { _id: holdingId, portfolio: portfolio._id },
    updates,
    { new: true }
  );
  if (!holding) throw new Error("Holding not found");
  return holding;
}

export async function removeHolding(userId, holdingId) {
  const portfolio = await getOrCreatePortfolio(userId);
  const holding = await PortfolioHolding.findOneAndDelete({ _id: holdingId, portfolio: portfolio._id });
  if (!holding) throw new Error("Holding not found");
  return holding;
}

// Every number here is calculated from the holding's stored quantity/avgBuyPrice and a
// live price lookup — nothing is estimated or invented. A holding whose live price
// can't be fetched reports currentValue/unrealizedPnl as null ("Data unavailable").
export async function getPortfolioSummary(userId) {
  const portfolio = await getOrCreatePortfolio(userId);
  const holdings = await PortfolioHolding.find({ portfolio: portfolio._id });

  const enriched = await Promise.all(
    holdings.map(async (h) => {
      const currentPrice = await getLivePrice(h.symbol);
      const currentValue = currentPrice !== null ? currentPrice * h.quantity : null;
      const costBasis = h.avgBuyPrice !== null && h.avgBuyPrice !== undefined ? h.avgBuyPrice * h.quantity : null;
      const unrealizedPnl = currentValue !== null && costBasis !== null ? currentValue - costBasis : null;
      const unrealizedPnlPct = unrealizedPnl !== null && costBasis ? (unrealizedPnl / costBasis) * 100 : null;

      return {
        id: h._id,
        symbol: h.symbol,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice ?? null,
        currentPrice,
        currentValue,
        costBasis,
        unrealizedPnl,
        unrealizedPnlPct
      };
    })
  );

  const totalValue = enriched.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  const totalCost = enriched.reduce((sum, h) => sum + (h.costBasis || 0), 0);
  const totalPnl = totalCost ? totalValue - totalCost : null;

  const allocation = enriched.map((h) => ({
    symbol: h.symbol,
    pctOfPortfolio: totalValue > 0 && h.currentValue !== null ? Math.round((h.currentValue / totalValue) * 1000) / 10 : null
  }));

  const largestPosition = allocation.reduce(
    (max, a) => (a.pctOfPortfolio !== null && a.pctOfPortfolio > (max?.pctOfPortfolio || 0) ? a : max),
    null
  );

  return {
    holdings: enriched,
    totalValue,
    totalCost: totalCost || null,
    totalPnl,
    allocation,
    concentrationWarning: largestPosition && largestPosition.pctOfPortfolio > 50
      ? `${largestPosition.symbol} represents ${largestPosition.pctOfPortfolio}% of the portfolio`
      : null
  };
}

export async function runPortfolioAiAnalysis(userId) {
  const summary = await getPortfolioSummary(userId);
  if (summary.holdings.length === 0) {
    throw new Error("Add at least one holding before running AI analysis");
  }
  const { raw, parsed } = await analyzePortfolio({
    holdings: summary.holdings,
    totalValue: summary.totalValue,
    allocation: summary.allocation
  });
  return { raw, parsed };
}
