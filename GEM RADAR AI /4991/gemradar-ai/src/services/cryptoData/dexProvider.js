import { requestWithRetry } from "@/lib/utils/httpClient";
import { withCache } from "@/lib/utils/cache";
import { cryptoProvidersConfig } from "@/config/cryptoProviders";

const { baseUrl } = cryptoProvidersConfig.dexscreener;
const PAIR_DATA_TTL_MS = 20_000;

export async function getTokenPairData(address) {
  return withCache(`dex-pairs:${address}`, PAIR_DATA_TTL_MS, async () => {
    const { data } = await requestWithRetry({ method: "get", url: `${baseUrl}/dex/tokens/${address}` });
    return data?.pairs || [];
  });
}

export async function searchPairs(query) {
  const { data } = await requestWithRetry({ method: "get", url: `${baseUrl}/dex/search`, params: { q: query } });
  return data?.pairs || [];
}
