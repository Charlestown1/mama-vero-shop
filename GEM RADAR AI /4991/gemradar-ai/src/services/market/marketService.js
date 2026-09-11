import { getMarketOverview, getTopMovers } from "@/services/cryptoData/coingeckoProvider";
import { summarizeMarket } from "@/services/ai/geminiService";

export async function getMarketSnapshot() {
  const errors = [];
  let overview = [];
  let movers = { gainers: [], losers: [] };

  try {
    overview = await getMarketOverview();
  } catch (err) {
    errors.push(`Market overview unavailable: ${err.message}`);
  }

  try {
    movers = await getTopMovers(8);
  } catch (err) {
    errors.push(`Top movers unavailable: ${err.message}`);
  }

  return {
    overview: overview.map((c) => ({
      symbol: c.symbol?.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change24h: c.price_change_percentage_24h,
      marketCap: c.market_cap,
      volume24h: c.total_volume
    })),
    gainers: movers.gainers.map((c) => ({ symbol: c.symbol?.toUpperCase(), change24h: c.price_change_percentage_24h, price: c.current_price })),
    losers: movers.losers.map((c) => ({ symbol: c.symbol?.toUpperCase(), change24h: c.price_change_percentage_24h, price: c.current_price })),
    errors: errors.length ? errors : null
  };
}

export async function getMarketAiSummary() {
  const snapshot = await getMarketSnapshot();
  if (snapshot.overview.length === 0) {
    throw new Error("No market data available to summarize — check provider connectivity");
  }
  const { raw, parsed } = await summarizeMarket(snapshot);
  return { raw, parsed };
}
