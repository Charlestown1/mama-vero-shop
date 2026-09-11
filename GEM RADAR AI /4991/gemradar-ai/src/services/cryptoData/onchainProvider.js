import { cryptoProvidersConfig } from "@/config/cryptoProviders";

const { baseUrl, apiKey } = cryptoProvidersConfig.onchain;

export function isOnchainProviderConfigured() {
  return Boolean(apiKey && baseUrl);
}

export async function getHolderData(address, blockchain) {
  if (!isOnchainProviderConfigured()) {
    throw new Error("On-chain data provider is not configured. Set ONCHAIN_API_KEY and ONCHAIN_API_BASE in .env (e.g. Moralis, GoPlus Security, or Etherscan+).");
  }
  return null; // wire real request once you've chosen a provider
}

export async function getContractSecurity(address, blockchain) {
  if (!isOnchainProviderConfigured()) {
    throw new Error("On-chain data provider is not configured. Set ONCHAIN_API_KEY and ONCHAIN_API_BASE in .env.");
  }
  return null;
}
