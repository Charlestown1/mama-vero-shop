export const cryptoProvidersConfig = {
  marketData: "coingecko",
  liquidityData: "dexscreener",
  onchainData: "onchain",

  coingecko: {
    baseUrl: process.env.COINGECKO_API_BASE || "https://api.coingecko.com/api/v3",
    apiKey: process.env.COINGECKO_API_KEY || ""
  },
  dexscreener: {
    baseUrl: process.env.DEXSCREENER_API_BASE || "https://api.dexscreener.com/latest"
  },
  onchain: {
    baseUrl: process.env.ONCHAIN_API_BASE || "",
    apiKey: process.env.ONCHAIN_API_KEY || ""
  }
};
