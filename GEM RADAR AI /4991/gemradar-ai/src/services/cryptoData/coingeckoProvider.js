import { requestWithRetry } from "@/lib/utils/httpClient";
import { withCache } from "@/lib/utils/cache";
import { cryptoProvidersConfig } from "@/config/cryptoProviders";

const { baseUrl, apiKey } = cryptoProvidersConfig.coingecko;

// TTLs are short on purpose — this is real-time-ish market data, not
// something that should look stale to a trader. The point of caching here
// is only to collapse many users hitting the same public endpoint within
// the same few seconds into one upstream call, not to serve old prices.
const MARKET_OVERVIEW_TTL_MS = 30_000;
const TOKEN_PRICE_TTL_MS = 20_000;
const TOP_MOVERS_TTL_MS = 30_000;

export async function getMarketOverview(ids = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "sui"]) {
  const cacheKey = `market-overview:${ids.join(",")}`;
  return withCache(cacheKey, MARKET_OVERVIEW_TTL_MS, async () => {
    const { data } = await requestWithRetry({
      method: "get",
      url: `${baseUrl}/coins/markets`,
      params: { vs_currency: "usd", ids: ids.join(","), x_cg_demo_api_key: apiKey || undefined }
    });
    return data;
  });
}

export async function getTokenPrice(id) {
  return withCache(`token-price:${id}`, TOKEN_PRICE_TTL_MS, async () => {
    const { data } = await requestWithRetry({
      method: "get",
      url: `${baseUrl}/simple/price`,
      params: { ids: id, vs_currencies: "usd", include_24hr_change: true }
    });
    return data[id];
  });
}

export async function getTopMovers(limit = 10) {
  return withCache(`top-movers:${limit}`, TOP_MOVERS_TTL_MS, async () => {
    const { data } = await requestWithRetry({
      method: "get",
      url: `${baseUrl}/coins/markets`,
      params: { vs_currency: "usd", order: "market_cap_desc", per_page: 100, page: 1 }
    });
    const sorted = [...data].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    return { gainers: sorted.slice(0, limit), losers: sorted.slice(-limit).reverse() };
  });
}
