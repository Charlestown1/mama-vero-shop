import { cryptoProvidersConfig } from "@/config/cryptoProviders";
import * as coingecko from "./coingeckoProvider";
import * as dex from "./dexProvider";
import * as onchain from "./onchainProvider";

const registry = { coingecko, dexscreener: dex, onchain };

export function getMarketDataProvider() {
  return registry[cryptoProvidersConfig.marketData];
}
export function getLiquidityProvider() {
  return registry[cryptoProvidersConfig.liquidityData];
}
export function getOnchainProvider() {
  return registry[cryptoProvidersConfig.onchainData];
}
